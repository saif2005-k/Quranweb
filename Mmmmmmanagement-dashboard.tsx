"use client";

import SupervisorStudentMatchingPanel from "@/components/supervisor-student-matching-panel";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import { RecitationSessionEditor } from "@/components/recitation-session-editor";
import ManagementStudentProfileModal from "@/components/management-student-profile-modal";
import ManagementSupervisorProfileModal from "@/components/management-supervisor-profile-modal";
import { formatRecitationRange } from "@/lib/quran-recitation";
import { TRACKS, type TrackName } from "@/lib/tracks";
type Supervisor = {
  id: string;
  full_name: string;
  phone: string | null;
  can_manage: boolean;
  can_supervise: boolean;
  is_active: boolean;
  created_at: string;
};

type SupervisorOption = {
  id: string;
  full_name: string;
};

type Student = {
  id: string;
  full_name: string;
  track: TrackName;
  current_plan: string;
  supervisor_id: string;
  account_status: string;
  points: number;
  rank: number | null;
  pages_recited: number;
  sessions_count: number;
  not_recited_count: number;
  supervisor: {
    id: string;
    full_name: string;
  } | null;
  created_at: string;
  last_recitation: {
    start_surah: number | null;
    start_ayah: number | null;
    end_surah: number | null;
    end_ayah: number | null;
  } | null;
};

type RecitationSession = {
  id: string;
  student_id: string;
  supervisor_id: string;
  track: string;
  plan: string;
  week_number: number | null;
  status:
    | "تم التسميع"
    | "تم جزئيًا"
    | "لم يتم التسميع"
    | null;
  recitation_details: string | null;
  not_recited_reason: string | null;
  supervisor_notes: string | null;
  recited_at: string | null;
  created_at: string;
  start_surah: number | null;
  start_ayah: number | null;
  end_surah: number | null;
  end_ayah: number | null;
};

type StudentRegistrationAvailability = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

type StudentRegistrationRequest = {
  id: string;
  fullName: string;
  phone: string;
  whatsappSameAsPhone: boolean;
  whatsappPhone: string | null;
  track: string;
  currentPlan: string | null;
  supervisorId: string | null;
  availability: StudentRegistrationAvailability[];
  createdAt: string;
  status: "pending";
    recitationMode: string | null;
};

type CurriculumEnrollmentRequest = {
  id: string;
  studentId: string;
  fullName: string;
  requestedAt: string;
  status: "pending" | "approved" | "rejected";
};

type SupportRequest = {
  id: string;
  reference_number: string;
  requester_id: string;
  requester_name: string;
  requester_role: "student" | "supervisor";
  request_type:
    | "complaint"
    | "technical"
    | "suggestion"
    | "question"
    | "other"
    | "password_reset";
  title: string;
  message: string;
  status: "pending" | "in_progress" | "resolved";
  admin_reply: string | null;
  proposed_password: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
};

type DeletedStudent = {
  id: string;
  full_name: string;
  track: TrackName;
  account_status: "deleted";
  phone: string;
};

type Panel =
  | "supervisors"
  | "students"
  | "history"
  | "accounts"
  | "student-requests"
  | "curriculum-enrollments"
  | "support"
  | "terms";

type RecitationTermSettings = {
  id: string;
  name: string;
  section: "male";
  start_date: string;
};

type RecitationTermsResponse = {
  terms: RecitationTermSettings[];
};

type PermissionChoice =
  | "supervisor"
  | "manager-supervisor";

async function requestJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...init?.headers,
    },
  });

  const result = (await response.json()) as T & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(
      result.error ?? "تعذر إتمام الطلب.",
    );
  }

  return result;
}

const colors = {
  green: "#15543f",
  deepGreen: "#0d4433",
  gold: "#c79a35",
  goldDark: "#a87922",
  ivory: "#fffdf3",
  text: "#294f40",
  muted: "#62796d",
  white: "#ffffff",
};

const cardStyle: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  borderRadius: "30px",
  background:
    "linear-gradient(145deg, rgba(255,253,242,0.88), rgba(244,240,217,0.72))",
  border: "1.5px solid rgba(199,154,53,0.60)",
  boxShadow:
    "0 20px 55px rgba(5,35,24,0.14), inset 0 1px 0 rgba(255,255,255,0.8)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
};

const buttonPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "48px",
  padding: "10px 20px",
  borderRadius: "16px",
  border: `1.5px solid ${colors.gold}`,
  background:
    "linear-gradient(135deg, #155a42, #0d4433)",
  color: colors.ivory,
  fontSize: "15px",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow:
    "0 8px 20px rgba(21,84,63,0.16)",
};

const buttonSecondary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "46px",
  padding: "9px 18px",
  borderRadius: "15px",
  border: `1px solid rgba(199,154,53,0.60)`,
  background: "rgba(255,252,239,0.70)",
  color: colors.green,
  fontSize: "14px",
  fontWeight: 800,
  cursor: "pointer",
};


const managementDashboardAnimations = `
  @keyframes managementPageEntry {
    from {
      opacity: 0;
      transform: translateY(18px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes managementSectionEntry {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.99);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes managementGlow {
    0%, 100% {
      opacity: 0.45;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.07);
    }
  }

  @keyframes managementShine {
    0% {
      transform: translateX(-120%);
    }
    55%, 100% {
      transform: translateX(120%);
    }
  }

  .management-dashboard-page {
    animation: managementPageEntry 0.65s ease-out both;
  }

  .management-dashboard-page section,
  .management-dashboard-page article {
    animation: managementSectionEntry 0.65s ease-out both;
  }

  .management-dashboard-page button,
  .management-dashboard-page a {
    transition:
      transform 0.22s ease,
      box-shadow 0.22s ease,
      filter 0.22s ease,
      background 0.22s ease,
      border-color 0.22s ease;
  }

  .management-dashboard-page button:hover:not(:disabled),
  .management-dashboard-page a:hover {
    transform: translateY(-2px);
  }

  .management-dashboard-page button:active:not(:disabled) {
    transform: translateY(0);
  }

  .management-dashboard-page input,
  .management-dashboard-page select,
  .management-dashboard-page textarea {
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.2s ease,
      background 0.2s ease;
  }

  .management-dashboard-page input:hover,
  .management-dashboard-page select:hover,
  .management-dashboard-page textarea:hover {
    border-color: rgba(199,154,53,0.72) !important;
  }

  .management-dashboard-page input:focus,
  .management-dashboard-page select:focus,
  .management-dashboard-page textarea:focus {
    border-color: rgba(199,154,53,0.95) !important;
    box-shadow: 0 0 0 4px rgba(199,154,53,0.11);
    transform: translateY(-1px);
  }

  .management-dashboard-page [role="button"] {
    transition:
      transform 0.22s ease,
      box-shadow 0.22s ease,
      background 0.22s ease;
  }

  .management-dashboard-page [role="button"]:hover {
    transform: translateY(-2px);
  }

  .management-dashboard-page::before {
    content: "";
    position: fixed;
    width: 520px;
    height: 520px;
    top: -260px;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 50%;
    background:
      radial-gradient(
        circle,
        rgba(236,205,124,0.18),
        transparent 68%
      );
    filter: blur(25px);
    pointer-events: none;
    z-index: 0;
    animation: managementGlow 8s ease-in-out infinite;
  }

  .management-dashboard-page::after {
    content: "";
    position: fixed;
    width: 360px;
    height: 360px;
    right: -180px;
    bottom: -140px;
    border-radius: 50%;
    background:
      radial-gradient(
        circle,
        rgba(199,154,53,0.12),
        transparent 68%
      );
    filter: blur(28px);
    pointer-events: none;
    z-index: 0;
    animation: managementGlow 10s ease-in-out 1s infinite reverse;
  }

  @media (prefers-reduced-motion: reduce) {
    .management-dashboard-page,
    .management-dashboard-page section,
    .management-dashboard-page article,
    .management-dashboard-page::before,
    .management-dashboard-page::after {
      animation: none !important;
    }

    .management-dashboard-page button,
    .management-dashboard-page a,
    .management-dashboard-page input,
    .management-dashboard-page select,
    .management-dashboard-page textarea,
    .management-dashboard-page [role="button"] {
      transition: none !important;
    }
  }
`;

export function ManagementDashboard({
  fullName,
  isAdminOne,
  canSupervise,
}: {
  fullName: string;
  isAdminOne: boolean;
  canSupervise: boolean;
}) {
  const [panel, setPanel] =
    useState<Panel>("students");

  const [selectedStudentProfile, setSelectedStudentProfile] =
    useState<Student | null>(null);

  const [selectedSupervisorForProfile, setSelectedSupervisorForProfile] =
    useState<Supervisor | null>(null);

  const [supervisors, setSupervisors] =
    useState<Supervisor[]>([]);

  const [supervisorOptions, setSupervisorOptions] =
    useState<SupervisorOption[]>([]);

  const [students, setStudents] =
    useState<Student[]>([]);

  const [studentSearch, setStudentSearch] =
    useState("");

  const [studentTrackFilter, setStudentTrackFilter] =
    useState<"all" | TrackName>("all");

  const [sessions, setSessions] =
    useState<RecitationSession[]>([]);

  const [studentRequests, setStudentRequests] =
    useState<StudentRegistrationRequest[]>([]);

  const [supportRequests, setSupportRequests] =
    useState<SupportRequest[]>([]);

  const [supportLoading, setSupportLoading] =
    useState(false);

  const [supportError, setSupportError] =
    useState("");

  const [supportSavingId, setSupportSavingId] =
    useState<string | null>(null);

  const [expandedSupportId, setExpandedSupportId] =
    useState<string | null>(null);

  const [supportReplyDrafts, setSupportReplyDrafts] =
    useState<Record<string, string>>({});

  const [supportStatusDrafts, setSupportStatusDrafts] =
    useState<Record<string, SupportRequest["status"]>>({});

  const [curriculumEnrollmentRequests, setCurriculumEnrollmentRequests] =
    useState<CurriculumEnrollmentRequest[]>([]);

  const [curriculumEnrollmentRequestsLoading, setCurriculumEnrollmentRequestsLoading] =
    useState(false);

  const [editingCurriculumEnrollment, setEditingCurriculumEnrollment] =
    useState<{
      id: string;
      status: CurriculumEnrollmentRequest["status"];
    } | null>(null);

  const [confirmingCurriculumEnrollmentDelete, setConfirmingCurriculumEnrollmentDelete] =
    useState<string | null>(null);

  const [studentRequestAssignments, setStudentRequestAssignments] =
    useState<
      Record<
        string,
        {
          supervisorId: string;
          currentPlan: string;
        }
      >
    >({});

  const [overviewStats, setOverviewStats] =
    useState({
      totalPagesRecited: 0,
      totalVersesRecited: 0,
    });

  async function loadOverviewStats() {
    try {
      const result = await requestJson<{
        stats: {
          totalPagesRecited: number;
          totalVersesRecited: number;
          totalSessions: number;
        };
      }>('/api/management/overview');

      setOverviewStats({
        totalPagesRecited:
          Number(
            result.stats?.totalPagesRecited ?? 0,
          ),
        totalVersesRecited:
          Number(
            result.stats?.totalVersesRecited ?? 0,
          ),
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "تعذر تحميل إحصاءات التسميع.",
      );
    }
  }

  const [deletedStudents, setDeletedStudents] =
    useState<DeletedStudent[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [exportingStudents, setExportingStudents] =
    useState(false);

  const [pending, setPending] =
    useState(false);

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const [editingSession, setEditingSession] =
    useState<RecitationSession | null>(null);

  const [fullNameInput, setFullNameInput] =
  useState("");

const [phone, setPhone] =
  useState("");

const [password, setPassword] =
  useState("");
  const [permission, setPermission] =
    useState<PermissionChoice>("supervisor");

  const [studentName, setStudentName] =
    useState("");

  const [track, setTrack] =
    useState<(typeof TRACKS)[number]["name"]>(
      TRACKS[0].name,
    );

  const [currentPlan, setCurrentPlan] =
    useState("");

  const [supervisorId, setSupervisorId] =
    useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const studentResult =
        await requestJson<{
          students: Student[];
          supervisorOptions: SupervisorOption[];
        }>("/api/management/students");

      setStudents(studentResult.students);
      setSupervisorOptions(
        studentResult.supervisorOptions,
      );

      await loadOverviewStats();

      if (isAdminOne) {
        const supervisorResult =
          await requestJson<{
            supervisors: Supervisor[];
          }>("/api/management/supervisors");

        setSupervisors(
          supervisorResult.supervisors,
        );
      } else {
        setSupervisors([]);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "تعذر تحميل البيانات.",
      );
    } finally {
      setLoading(false);
    }
  }



  async function loadStudentRequests() {
    if (!isAdminOne) return;

    try {
      const result = await requestJson<{
        requests: StudentRegistrationRequest[];
      }>("/api/management/student-registration-requests");

      setStudentRequests(result.requests);

      setStudentRequestAssignments((current) =>
        Object.fromEntries(
          result.requests.map((request) => [
            request.id,
            current[request.id] ?? {
              supervisorId: "",
              currentPlan: "",
            },
          ]),
        ),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "تعذر تحميل طلبات تسجيل الطلاب.",
      );
    }
  }

  async function loadSupportRequests() {
    if (!isAdminOne) return;

    setSupportLoading(true);
    setSupportError("");

    try {
      const result = await requestJson<{
        requests: SupportRequest[];
      }>("/api/management/support");

      setSupportRequests(result.requests);
    } catch (requestError) {
      setSupportError(
        requestError instanceof Error
          ? requestError.message
          : "تعذر تحميل طلبات الدعم.",
      );
    } finally {
      setSupportLoading(false);
    }
  }

  async function saveSupportRequest(request: SupportRequest) {
    setSupportSavingId(request.id);
    setError("");
    setNotice("");

    try {
      const result = await requestJson<{
        request: SupportRequest;
      }>("/api/management/support", {
        method: "PATCH",
        body: JSON.stringify({
          id: request.id,
          status: supportStatusDrafts[request.id] ?? request.status,
          adminReply: supportReplyDrafts[request.id] ?? request.admin_reply,
        }   ),
      });
      

      setSupportRequests((current) =>
        current.map((item) =>
          item.id === request.id ? result.request : item,
        ),
      );
      setSupportReplyDrafts((current) => ({
        ...current,
        [request.id]: result.request.admin_reply ?? "",
      }));
      setSupportStatusDrafts((current) => ({
        ...current,
        [request.id]: result.request.status,
      }));
      setNotice("تم حفظ تحديث طلب الدعم.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "تعذر تحديث طلب الدعم.",
      );
    } finally {
      setSupportSavingId(null);
    }
  }
async function handlePasswordResetAction(
  request: SupportRequest,
  action: "approve_password_reset" | "reject_password_reset",
) {
  const isApprove = action === "approve_password_reset";

  const confirmed = window.confirm(
    isApprove
      ? `هل أنت متأكد من الموافقة على استعادة كلمة مرور ${request.requester_name}؟`
      : `هل أنت متأكد من رفض طلب استعادة كلمة مرور ${request.requester_name}؟`,
  );

  if (!confirmed) return;

  setSupportSavingId(request.id);
  setError("");
  setNotice("");

  try {
    const result = await requestJson<{
      request: SupportRequest;
    }>("/api/management/support", {
      method: "PATCH",
      body: JSON.stringify({
        id: request.id,
        action,
      }),
    });

    setSupportRequests((current) =>
      current.map((item) =>
        item.id === request.id ? result.request : item,
      ),
    );

    setNotice(
      isApprove
        ? "تمت الموافقة على طلب استعادة كلمة المرور بنجاح."
        : "تم رفض طلب استعادة كلمة المرور.",
    );
  } catch (requestError) {
    setError(
      requestError instanceof Error
        ? requestError.message
        : "تعذر معالجة طلب استعادة كلمة المرور.",
    );
  } finally {
    setSupportSavingId(null);
  }
}
  async function loadCurriculumEnrollmentRequests() {
    setCurriculumEnrollmentRequestsLoading(true);

    try {
      const result = await requestJson<{
        requests: CurriculumEnrollmentRequest[];
      }>("/api/management/curriculum-enrollments");

      setCurriculumEnrollmentRequests(result.requests);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "تعذر تحميل طلبات الانضمام إلى منهاج الدارسين.",
      );
    } finally {
      setCurriculumEnrollmentRequestsLoading(false);
    }
  }

  async function loadDeletedStudents() {
    if (!isAdminOne) return;

    try {
      const result = await requestJson<{
        students: DeletedStudent[];
      }>("/api/management/students?status=deleted");

      setDeletedStudents(result.students);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "تعذر تحميل الحسابات المحذوفة.",
      );
    }
  }

  async function handleDeleteStudentAccount(
    student: Student,
  ) {
    if (!isAdminOne) return;

    const confirmed = window.confirm(
      `هل تريد حذف حساب الطالب ${student.full_name}؟`,
    );

    if (!confirmed) return;

    setPending(true);
    setError("");
    setNotice("");

    try {
      await requestJson(
        `/api/management/students/${student.id}`,
        {
          method: "DELETE",
        },
      );

      setNotice(
        `تم حذف حساب الطالب ${student.full_name}.`,
      );
      setSelectedStudentProfile(null);

      await Promise.all([
        loadData(),
        loadDeletedStudents(),
      ]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "تعذر حذف حساب الطالب.",
      );
    } finally {
      setPending(false);
    }
  }

  async function restoreDeletedStudent(
    student: DeletedStudent,
  ) {
    const confirmed = window.confirm(
      `هل تريد استعادة حساب الطالب ${student.full_name}؟`,
    );

    if (!confirmed) return;

    setPending(true);
    setError("");
    setNotice("");

    try {
      await requestJson(
        `/api/management/students/${student.id}`,
        {
          method: "POST",
          body: JSON.stringify({ action: "restore" }),
        },
      );

      setNotice(`تمت استعادة حساب الطالب ${student.full_name}.`);

      await Promise.all([
        loadData(),
        loadDeletedStudents(),
      ]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "تعذرت استعادة حساب الطالب.",
      );
    } finally {
      setPending(false);
    }
  }

  async function permanentlyDeleteStudent(
    student: DeletedStudent,
  ) {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف حساب الطالب ${student.full_name} نهائيًا؟\n\nسيُحذف الحساب نهائيًا ولا يمكن التراجع عن ذلك. لن تُحذف سجلات التسميع، وسيُرفض الحذف فقط إذا وُجدت جلسات تسميع مرتبطة بالحساب.`,
    );

    if (!confirmed) return;

    setPending(true);
    setError("");
    setNotice("");

    try {
      await requestJson(
        `/api/management/students/${student.id}`,
        {
          method: "POST",
          body: JSON.stringify({
            action: "permanent-delete",
          }),
        },
      );

      setNotice(`تم حذف حساب الطالب ${student.full_name} نهائيًا.`);

      await Promise.all([
        loadData(),
        loadDeletedStudents(),
      ]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "تعذر حذف حساب الطالب نهائيًا.",
      );
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (
      panel === "supervisors" &&
      isAdminOne
    ) {
      void loadDeletedStudents();
    }
  }, [panel, isAdminOne]);

  useEffect(() => {
    if (
      panel === "student-requests" &&
      isAdminOne
    ) {
      void loadStudentRequests();
    }
  }, [panel, isAdminOne]);

  useEffect(() => {
    if (panel === "curriculum-enrollments") {
      void loadCurriculumEnrollmentRequests();
    }
  }, [panel]);

  useEffect(() => {
  if (
    panel === "accounts" &&
    isAdminOne
  ) {
    void loadDeletedStudents();
  }
}, [panel, isAdminOne]);

  useEffect(() => {
    if (panel !== "history") return;

    setError("");

    void requestJson<{
      sessions: RecitationSession[];
    }>("/api/management/sessions")
      .then((result) => {
        setSessions(result.sessions);
      })
      .catch((requestError: unknown) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "تعذر تحميل سجل التسميع.",
        );
      });
  }, [panel]);

  function resetSupervisorForm() {
    setFullNameInput("");
    setPhone("");
    setPassword("");
    setPermission("supervisor");
  }

    async function saveSupervisor(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setPending(true);
    setError("");
    setNotice("");

    try {
      if (!phone.trim()) {
  throw new Error("أدخل رقم الهاتف.");
}
      const body: Record<
  string,
  string | boolean
> = {
  fullName: fullNameInput,
  phone: phone.trim(),
  permission,
};
      body.password = password;

      if (!password) {
        throw new Error("أدخل كلمة مرور.");
      }

      if (password.length < 6) {
        throw new Error(
          "كلمة المرور يجب أن تكون 6 أحرف على الأقل.",
        );
      }

      if (!/[A-Z]/.test(password)) {
        throw new Error(
          "يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل.",
        );
      }

      if (!/[0-9]/.test(password)) {
        throw new Error(
          "يجب أن تحتوي كلمة المرور على رقم واحد على الأقل.",
        );
      }

      if (!/[^A-Za-z0-9]/.test(password)) {
        throw new Error(
          "يجب أن تحتوي كلمة المرور على رمز واحد على الأقل.",
        );
      }

      await requestJson("/api/management/supervisors", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setNotice("تمت إضافة المشرف.");

      resetSupervisorForm();
      await loadData();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "تعذر حفظ بيانات المشرف.",
      );
    } finally {
      setPending(false);
    }
  }
  async function deleteSupervisor(
    supervisor: Supervisor,
  ) {
    if (!isAdminOne) {
      setError(
        "ليس لديك صلاحية لحذف المشرفين.",
      );
      return;
    }

    const confirmed =
      window.confirm(
        `هل أنت متأكد من حذف المشرف "${supervisor.full_name}"؟\n\nسيتم حذف حساب المشرف نهائيًا.`,
      );

    if (!confirmed) return;

    setPending(true);
    setError("");
    setNotice("");

    try {
      await requestJson(
        `/api/management/supervisors/${supervisor.id}`,
        {
          method: "DELETE",
        },
      );

      setNotice(
        `تم حذف المشرف "${supervisor.full_name}" بنجاح.`,
      );

      await loadData();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "تعذر حذف المشرف.",
      );
    } finally {
      setPending(false);
    }
  }

  async function saveStudent(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setPending(true);
    setError("");
    setNotice("");

    try {
      await requestJson(
        "/api/management/students",
        {
          method: "POST",
          body: JSON.stringify({
            fullName: studentName,
            track,
            currentPlan,
            supervisorId,
          }),
        },
      );

      setStudentName("");
      setCurrentPlan("");

      setNotice(
        "تمت إضافة الطالب وإسناده إلى المشرف.",
      );

      await loadData();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "تعذر إضافة الطالب.",
      );
    } finally {
      setPending(false);
    }
  }

  async function deleteSession(
    session: RecitationSession,
  ) {
    const confirmed =
      window.confirm(
        "هل أنت متأكد من حذف جلسة التسميع؟ سيتم حذف هذا السجل التاريخي نهائيًا.",
      );

    if (!confirmed) return;

    setPending(true);
    setError("");
    setNotice("");

    try {
      await requestJson(
        `/api/management/sessions/${session.id}`,
        {
          method: "DELETE",
        },
      );

      setSessions((current) =>
        current.filter(
          (item) =>
            item.id !== session.id,
        ),
      );

      setNotice(
        "تم حذف جلسة التسميع.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "تعذر حذف الجلسة.",
      );
    } finally {
      setPending(false);
    }
  }



  async function handleStudentRequest(
    request: StudentRegistrationRequest,
    action: "approve" | "delete",
  ) {
    if (!isAdminOne) return;

    const assignment =
      studentRequestAssignments[
        request.id
      ];

    if (
      action === "approve" &&
      (!assignment?.supervisorId ||
        !assignment.currentPlan.trim())
    ) {
      setError(
        "اختر مشرفًا واكتب الخطة الحالية قبل قبول الحساب.",
      );
      return;
    }

    const confirmed =
      window.confirm(
        action === "approve"
          ? `قبول طلب تسجيل ${request.fullName}؟`
          : `حذف طلب تسجيل ${request.fullName}؟`,
      );

    if (!confirmed) return;

    setPending(true);
    setError("");
    setNotice("");

    try {
      await requestJson(
        `/api/management/student-registration-requests/${request.id}`,
        {
          method:
            action === "approve"
              ? "PATCH"
              : "DELETE",
          ...(action === "approve"
            ? {
                body: JSON.stringify({
                  supervisorId:
                    assignment.supervisorId,
                  currentPlan:
                    assignment.currentPlan.trim(),
                }),
              }
            : {}),
        },
      );

      setNotice(
        action === "approve"
          ? `تم تفعيل حساب ${request.fullName}.`
          : `تم حذف طلب ${request.fullName}.`,
      );

      await Promise.all([
        loadStudentRequests(),
        loadData(),
      ]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "تعذرت معالجة طلب التسجيل.",
      );
    } finally {
      setPending(false);
    }
  }

  async function handleCurriculumEnrollmentRequest(
    request: CurriculumEnrollmentRequest,
    status: CurriculumEnrollmentRequest["status"],
  ) {
    setPending(true);
    setError("");
    setNotice("");

    try {
      await requestJson(
        `/api/management/curriculum-enrollments/${request.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
      );

      setNotice(
        status === "approved"
          ? `تم قبول طلب انضمام ${request.fullName}.`
          : status === "rejected"
            ? `تم رفض طلب انضمام ${request.fullName}.`
            : `تمت إعادة طلب ${request.fullName} إلى قيد المراجعة.`,
      );
      setEditingCurriculumEnrollment(null);
      await loadCurriculumEnrollmentRequests();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "تعذرت معالجة طلب الانضمام.",
      );
    } finally {
      setPending(false);
    }
  }

  async function deleteCurriculumEnrollment(
    request: CurriculumEnrollmentRequest,
  ) {
    setPending(true);
    setError("");
    setNotice("");

    try {
      await requestJson(
        `/api/management/curriculum-enrollments/${request.id}`,
        { method: "DELETE" },
      );

      setNotice(
        `تم حذف اشتراك ${request.fullName} في منهاج الدارسين.`,
      );
      setConfirmingCurriculumEnrollmentDelete(null);
      setEditingCurriculumEnrollment(null);
      await loadCurriculumEnrollmentRequests();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "تعذر حذف اشتراك الطالب.",
      );
    } finally {
      setPending(false);
    }
  }

  const activeSupervisors = isAdminOne
    ? supervisors.filter(
        (supervisor) =>
          supervisor.is_active &&
          supervisor.can_supervise,
      )
    : supervisorOptions;

  const filteredStudents = students.filter(
    (student) => {
      const normalizedSearch =
        studentSearch
          .trim()
          .toLocaleLowerCase("ar");

      const matchesSearch =
        normalizedSearch === "" ||
        student.full_name
          .toLocaleLowerCase("ar")
          .includes(normalizedSearch);

      const matchesTrack =
        studentTrackFilter === "all" ||
        student.track === studentTrackFilter;

      return (
        matchesSearch &&
        matchesTrack
      );
    },
  );

  async function downloadStudentsExcel() {
    setError("");
    setNotice("");
    setExportingStudents(true);

    try {
      const response = await fetch(
        "/api/management/students/export",
      );

      if (!response.ok) {
        const result = (await response.json()) as {
          error?: string;
        };
        throw new Error(
          result.error ?? "تعذر تنزيل معلومات الطلاب.",
        );
      }

      const fileUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = `بيانات_الطلاب_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
      setNotice("تم تنزيل معلومات الطلاب.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "تعذر تنزيل معلومات الطلاب.",
      );
    } finally {
      setExportingStudents(false);
    }
  }

  const trackContent =
    TRACKS.find(
      (item) => item.name === track,
    )?.content.join("، ");

  const navItems: {
  id: Panel;
  icon: string;
  label: string;
  description: string;
}[] = [
  {
    id: "students",
    icon: "🎓",
    label: "الطلاب",
    description: "الطلاب والإسناد",
  },

  ...(isAdminOne
    ? [
        {
          id: "supervisors" as const,
          icon: "👥",
          label: "المشرفون",
          description: "ملفات المشرفين والطلاب المرتبطون",
        },
        {
          id: "accounts" as const,
          icon: "🗃️",
          label: "الحسابات",
          description: "الحسابات المحذوفة وإدارتها",
        },
        {
          id: "terms" as const,
          icon: "🗓️",
          label: "إعداد الفصل",
          description: "بداية الفصل الدراسي للذكور",
        },
      ]
    : []),

  {
    id: "history",
    icon: "📖",
    label: "سجل التسميع",
    description: "الجلسات والنتائج",
  },
];

navItems.push({
  id: "curriculum-enrollments",
  icon: "📚",
  label: "طلبات المنهاج",
  description: "طلبات بانتظار المراجعة",
});

if (isAdminOne) {
  navItems.push({
    id: "student-requests",
    icon: "📝",
    label: "طلبات تسجيل الطلاب",
    description: "بانتظار موافقتك",
  });

  navItems.push({
    id: "support",
    icon: "📨",
    label: "الشكاوى والطلبات",
    description: "شكاوى واستفسارات واقتراحات",
  });
}
  return (
    <main className="management-dashboard-page"
      dir="rtl"
      style={{
        minHeight: "100vh",
        position: "relative",
        overflowX: "hidden",
        background:
          "linear-gradient(135deg, #173e30 0%, #285941 46%, #14392d 100%)",
        color: colors.text,
      }}
    >

        <SupervisorStudentMatchingPanel
          requests={studentRequests}
          assignments={studentRequestAssignments}
        />

      <style>{managementDashboardAnimations}</style>
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-260px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "700px",
            height: "700px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(236,205,124,0.26), transparent 68%)",
            filter: "blur(25px)",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: "-180px",
            top: "8%",
            width: "450px",
            height: "80%",
            opacity: 0.18,
            background:
              "radial-gradient(ellipse at 30% 12%, #80975b 0 8%, transparent 9%), radial-gradient(ellipse at 58% 30%, #587e47 0 11%, transparent 12%), radial-gradient(ellipse at 28% 52%, #769351 0 10%, transparent 11%), radial-gradient(ellipse at 60% 75%, #426c40 0 12%, transparent 13%)",
            filter: "blur(3px)",
          }}
        />

        <div
          style={{
            position: "absolute",
            right: "-180px",
            top: "8%",
            width: "450px",
            height: "80%",
            opacity: 0.17,
            background:
              "radial-gradient(ellipse at 65% 12%, #80985b 0 9%, transparent 10%), radial-gradient(ellipse at 40% 30%, #567b46 0 12%, transparent 13%), radial-gradient(ellipse at 70% 52%, #769252 0 10%, transparent 11%), radial-gradient(ellipse at 35% 76%, #426b40 0 12%, transparent 13%)",
            filter: "blur(3px)",
          }}
        />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 5,
        }}
      >
        <DashboardHeader
          fullName={fullName}
          current="management"
          canManage
          canSupervise={canSupervise}
        />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: "1280px",
          margin: "0 auto",
          boxSizing: "border-box",
          padding:
            "32px clamp(14px, 4vw, 32px) 70px",
        }}
      >
        <section
          style={{
            ...cardStyle,
            padding:
              "clamp(25px, 5vw, 42px)",
            marginBottom: "20px",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "-90px",
              left: "-90px",
              width: "240px",
              height: "240px",
              border:
                "1px solid rgba(199,154,53,0.22)",
              borderRadius: "50%",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 2,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "20px",
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 7px",
                  color: colors.goldDark,
                  fontSize: "14px",
                  fontWeight: 800,
                }}
              >
                مساحة الإدارة
              </p>

              <h1
                style={{
                  margin: 0,
                  color: colors.green,
                  fontSize:
                    "clamp(30px, 5vw, 48px)",
                  fontWeight: 900,
                  lineHeight: 1.3,
                }}
              >
                إدارة المشروع
              </h1>

              <p
                style={{
                  margin: "9px 0 0",
                  color: colors.muted,
                  fontSize: "15px",
                  lineHeight: 1.8,
                  fontWeight: 600,
                }}
              >
                إدارة ومتابعة مشروع
                فالتسموا نورًا القرآني
              </p>
            </div>

            <Link
              href="/management/curriculum-councils"
              style={{
                ...buttonPrimary,
                textDecoration: "none",
                minHeight: "52px",
              }}
            >
              📚 مجالس منهاج الدارسين
            </Link>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(170px, 1fr))",
            gap: "13px",
            marginBottom: "20px",
          }}
        >
          {[
            {
              icon: "👥",
              value: supervisors.length,
              label: "المشرفون",
            },
            {
              icon: "🎓",
              value: students.length,
              label: "الطلاب",
            },
            {
              icon: "📄",
              value: Number(overviewStats.totalPagesRecited ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 }),
              label: "عدد الصفحات المسمعة",
            },
            {
              icon: "📖",
              value: overviewStats.totalVersesRecited,
              label: "عدد الآيات المسمعة",
            },
            {
              icon: "📚",
              value: sessions.length,
              label: "السجلات المحمّلة",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                ...cardStyle,
                padding: "20px",
                minHeight: "105px",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "13px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    flexShrink: 0,
                    borderRadius: "15px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      "rgba(199,154,53,0.12)",
                    border:
                      "1px solid rgba(199,154,53,0.32)",
                    fontSize: "22px",
                  }}
                >
                  {item.icon}
                </div>

                <div>
                  <strong
                    style={{
                      display: "block",
                      color: colors.green,
                      fontSize: "28px",
                      fontWeight: 900,
                      lineHeight: 1,
                    }}
                  >
                    {item.value}
                  </strong>

                  <span
                    style={{
                      display: "block",
                      marginTop: "5px",
                      color: colors.muted,
                      fontSize: "13px",
                      fontWeight: 700,
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section
          style={{
            ...cardStyle,
            padding: "12px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(155px, 1fr))",
              gap: "8px",
            }}
          >
            {navItems.map((item) => {
              const active =
                panel === item.id;

              return (
                <button
                  key={item.id}
                  aria-pressed={active}
                  onClick={() =>
                    setPanel(item.id)
                  }
                  type="button"
                  style={{
                    border: active
                      ? `1px solid ${colors.gold}`
                      : "1px solid transparent",
                    borderRadius: "18px",
                    padding: "13px 11px",
                    background: active
                      ? "linear-gradient(135deg, #155a42, #0d4433)"
                      : "rgba(255,253,243,0.42)",
                    color: active
                      ? colors.ivory
                      : colors.green,
                    cursor: "pointer",
                    textAlign: "center",
                    transition:
                      "all 0.2s ease",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      fontSize: "21px",
                      marginBottom: "4px",
                    }}
                  >
                    {item.icon}
                  </span>

                  <strong
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: 900,
                    }}
                  >
                    {item.label}
                  </strong>

                  <span
                    style={{
                      display: "block",
                      marginTop: "3px",
                      fontSize: "11px",
                      opacity: active
                        ? 0.9
                        : 0.65,
                      fontWeight: 600,
                    }}
                  >
                    {item.description}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {error && (
          <div
            role="alert"
            style={{
              marginBottom: "14px",
              padding: "13px 17px",
              borderRadius: "17px",
              background: "rgba(255,245,245,0.96)",
            
              border: "1px solid rgba(139,30,30,0.35)",
 
              color: "#8B1E1E",
              fontSize: "14px",
              fontWeight: 800,
              lineHeight: 1.6,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            style={{
              marginBottom: "14px",
              padding: "13px 17px",
              background: "rgba(255,255,255,0.10)",
border: "1px solid rgba(255,255,255,0.18)",
color: "#ffffff",

              fontSize: "14px",
              fontWeight: 800,
              lineHeight: 1.6,
            }}
          >
            ✓ {notice}
          </div>
        )}

        {loading ? (
          <section
            style={{
              ...cardStyle,
              padding: "50px 20px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "35px",
                marginBottom: "12px",
              }}
            >
              🌿
            </div>

            <p
              style={{
                margin: 0,
                color: colors.green,
                fontWeight: 800,
              }}
            >
              جارٍ تحميل بيانات المشروع...
            </p>
          </section>
        ) : (
          <>
            {panel === "terms" && isAdminOne && (
              <section style={cardStyle}>
                <div
                  style={{
                    padding: "clamp(22px, 4vw, 34px)",
                  }}
                >
                  <SectionTitle
                    icon="🗓️"
                    title="إعداد الفصل الدراسي للذكور"
                    description="حدد اسم الفصل وتاريخ بدايته. يُحتسب الأسبوع الأول من هذا التاريخ، ويستمر كل أسبوع سبعة أيام وفق توقيت عمّان."
                  />

                  {termLoading ? (
                    <div
                      role="status"
                      style={{
                        marginTop: "20px",
                        padding: "18px",
                        borderRadius: "16px",
                        background: "rgba(255,253,243,0.7)",
                        color: colors.green,
                        fontWeight: 800,
                      }}
                    >
                      جارٍ تحميل إعدادات الفصل الدراسي...
                    </div>
                  ) : (
                    <form
                      onSubmit={saveTermSettings}
                      style={{
                        display: "grid",
                        gap: "18px",
                        marginTop: "22px",
                        maxWidth: "680px",
                      }}
                    >
                      <label
                        style={{
                          display: "grid",
                          gap: "7px",
                          color: colors.green,
                          fontSize: "14px",
                          fontWeight: 800,
                        }}
                      >
                        اسم الفصل الدراسي
                        <input
                          type="text"
                          value={termName}
                          onChange={(event) => setTermName(event.target.value)}
                          placeholder="مثال: الفصل الأول 2026"
                          required
                          maxLength={120}
                          style={inputStyle}
                        />
                      </label>

                      <label
                        style={{
                          display: "grid",
                          gap: "7px",
                          color: colors.green,
                          fontSize: "14px",
                          fontWeight: 800,
                        }}
                      >
                        تاريخ بداية الفصل الدراسي للذكور
                        <input
                          type="date"
                          value={termStartDate}
                          onChange={(event) => setTermStartDate(event.target.value)}
                          required
                          style={inputStyle}
                        />
                      </label>

                      {termSettings && (
                        <div
                          style={{
                            padding: "14px 16px",
                            borderRadius: "15px",
                            border: "1px solid rgba(199,154,53,0.45)",
                            background: "rgba(255,253,243,0.7)",
                            color: colors.text,
                            lineHeight: 1.9,
                            fontSize: "13px",
                          }}
                        >
                          <strong style={{ color: colors.green }}>
                            الفصل المحفوظ حاليًا:
                          </strong>
                          <div>{termSettings.name}</div>
                          <div>
                            تاريخ البداية:{" "}
                            {new Date(`${termSettings.start_date}T12:00:00`).toLocaleDateString("ar-JO")}
                          </div>
                          <div>
                            تنبيه: إذا سُجّل تسميع فعلي مرتبط بهذا الفصل، فقد يرفض النظام تغيير تاريخ البداية حفاظًا على ترتيب الأسابيع والسجلات.
                          </div>
                        </div>
                      )}

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "10px",
                          alignItems: "center",
                        }}
                      >
                        <button
                          type="submit"
                          disabled={termSaving || !termStartDate || !termName.trim()}
                          style={{
                            ...buttonPrimary,
                            opacity: termSaving ? 0.7 : 1,
                            cursor: termSaving ? "wait" : "pointer",
                          }}
                        >
                          {termSaving ? "جارٍ الحفظ..." : "حفظ إعدادات الفصل"}
                        </button>
                        <button
                          type="button"
                          disabled={termSaving || termLoading}
                          onClick={() => void loadTermSettings()}
                          style={buttonSecondary}
                        >
                          إعادة تحميل الإعدادات
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </section>
            )}

            {panel === "student-requests" &&
              isAdminOne && (
                <section style={cardStyle}>
                  <div
                    style={{
                      padding:
                        "clamp(22px, 4vw, 34px)",
                    }}
                  >
                    <SectionTitle
                      icon="📝"
                      title="طلبات تسجيل الطلاب"
                      description="الطلبات الجديدة بانتظار موافقة Admin 1."
                    />

                    {studentRequests.length ===
                    0 ? (
                      <EmptyState text="لا توجد طلبات تسجيل معلقة." />
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gap: "14px",
                          marginTop: "22px",
                        }}
                      >
                        {studentRequests.map(
                          (request) => (
                            <article
                              key={
                                request.id
                              }
                              style={{
                                padding: "18px",
                                border:
                                  "1px solid rgba(199,154,53,0.4)",
                                borderRadius:
                                  "16px",
                                background:
                                  "rgba(255,253,243,0.7)",
                              }}
                            >
                <SupervisorStudentMatchingPanel
                  requests={[request]}
                  assignments={studentRequestAssignments}
                />

                              <div
                                style={{
                                  display:
                                    "flex",
                                  flexWrap:
                                    "wrap",
                                  justifyContent:
                                    "space-between",
                                  gap: "16px",
                                  alignItems:
                                    "center",
                                }}
                              >
                                <div>
                                  <h3
                                    style={{
                                      margin:
                                        "0 0 8px",
                                      color:
                                        colors.green,
                                    }}
                                  >
                                    {
                                      request.fullName
                                    }
                                  </h3>

                                  <p
                                    style={{
                                      margin:
                                        "4px 0",
                                      color:
                                        colors.text,
                                    }}
                                  >
                                    الهاتف:{" "}
                                    {
                                      request.phone
                                    }
                                  </p>

                                  <p
                                    style={{
                                      margin:
                                        "4px 0",
                                      color:
                                        colors.text,
                                    }}
                                  >
                                    المسار:{" "}
                                    {
                                      request.track
                                    }
                                  </p>

                                  <p
                                    style={{
                                      margin:
                                        "4px 0",
                                      color:
                                        colors.muted,
                                      fontSize:
                                        "13px",
                                    }}
                                  >
                                    تاريخ
                                    التسجيل:{" "}
                                    {new Date(
                                      request.createdAt,
                                    ).toLocaleString(
                                      "ar",
                                      {
                                        dateStyle:
                                          "medium",
                                        timeStyle:
                                          "short",
                                      },
                                    )}
                                  </p>

                                  <p
                                    style={{
                                      margin:
                                        "8px 0 0",
                                    }}
                                  >
                                    <StatusPill>
                                      بانتظار الموافقة
                                    </StatusPill>
                                  </p>
                                </div>

                                <div
                                  style={{
                                    display:
                                      "grid",
                                    gap: "10px",
                                    width:
                                      "min(100%, 340px)",
                                  }}
                                >
                                  <label
                                    style={{
                                      display:
                                        "grid",
                                      gap: "5px",
                                      color:
                                        colors.green,
                                      fontSize:
                                        "13px",
                                      fontWeight:
                                        800,
                                    }}
                                  >
                                    المشرف

                                    <select
                                      value={
                                        studentRequestAssignments[
                                          request.id
                                        ]
                                          ?.supervisorId ??
                                        ""
                                      }
                                      onChange={(
                                        event,
                                      ) =>
                                        setStudentRequestAssignments(
                                          (
                                            current,
                                          ) => ({
                                            ...current,
                                            [request.id]:
                                              {
                                                supervisorId:
                                                  event
                                                    .target
                                                    .value,
                                                currentPlan:
                                                  current[
                                                    request
                                                      .id
                                                  ]
                                                    ?.currentPlan ??
                                                  "",
                                              },
                                          }),
                                        )
                                      }
                                      style={{
                                        ...inputStyle,
                                        width:
                                          "100%",
                                      }}
                                    >
                                      <option value="">
                                        اختر
                                        مشرفًا
                                        نشطًا
                                      </option>

                                      {activeSupervisors.map(
                                        (
                                          supervisor,
                                        ) => (
                                          <option
                                            key={
                                              supervisor.id
                                            }
                                            value={
                                              supervisor.id
                                            }
                                          >
                                            {
                                              supervisor.full_name
                                            }
                                          </option>
                                        ),
                                      )}
                                    </select>
                                  </label>

                                  <label
                                    style={{
                                      display:
                                        "grid",
                                      gap: "5px",
                                      color:
                                        colors.green,
                                      fontSize:
                                        "13px",
                                      fontWeight:
                                        800,
                                    }}
                                  >
                                    الخطة الحالية

                                    <input
                                      value={
                                        studentRequestAssignments[
                                          request.id
                                        ]
                                          ?.currentPlan ??
                                        ""
                                      }
                                      onChange={(
                                        event,
                                      ) =>
                                        setStudentRequestAssignments(
                                          (
                                            current,
                                          ) => ({
                                            ...current,
                                            [request.id]:
                                              {
                                                supervisorId:
                                                  current[
                                                    request
                                                      .id
                                                  ]
                                                    ?.supervisorId ??
                                                  "",
                                                currentPlan:
                                                  event
                                                    .target
                                                    .value,
                                              },
                                          }),
                                        )
                                      }
                                      maxLength={
                                        240
                                      }
                                      style={{
                                        ...inputStyle,
                                        width:
                                          "100%",
                                      }}
                                      placeholder="تُحدد إداريًا"
                                    />
                                  </label>

                                  <div
                                    style={{
                                      display:
                                        "flex",
                                      flexWrap:
                                        "wrap",
                                      gap: "8px",
                                    }}
                                  >
                                    <button
                                      type="button"
                                      disabled={
                                        pending ||
                                        !studentRequestAssignments[
                                          request.id
                                        ]
                                          ?.supervisorId ||
                                        !studentRequestAssignments[
                                          request.id
                                        ]
                                          ?.currentPlan.trim()
                                      }
                                      onClick={() =>
                                        void handleStudentRequest(
                                          request,
                                          "approve",
                                        )
                                      }
                                      style={{
                                        ...buttonPrimary,
                                        opacity:
                                          pending ||
                                          !studentRequestAssignments[
                                            request.id
                                          ]
                                            ?.supervisorId ||
                                          !studentRequestAssignments[
                                            request.id
                                          ]
                                            ?.currentPlan.trim()
                                            ? 0.55
                                            : 1,
                                      }}
                                    >
                                      قبول الحساب
                                    </button>

                                    <button
                                      type="button"
                                      disabled={
                                        pending
                                      }
                                      onClick={() =>
                                        void handleStudentRequest(
                                          request,
                                          "delete",
                                        )
                                      }
                                      style={{
                                        ...buttonSecondary,
                                        color:
                                          "#8a2e2e",
                                      }}
                                    >
                                      حذف الطلب
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </article>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </section>
              )}

            {panel === "curriculum-enrollments" && (
              <section style={cardStyle}>
                <div
                  style={{
                    padding: "clamp(22px, 4vw, 34px)",
                  }}
                >
                  <SectionTitle
                    icon="📚"
                    title="طلبات الانضمام إلى منهاج الدارسين"
                    description="راجع حالات اشتراك الطلاب وحدّثها أو احذف اشتراك المنهاج."
                  />

                  {curriculumEnrollmentRequestsLoading ? (
                    <EmptyState text="جارٍ تحميل طلبات الانضمام..." />
                  ) : curriculumEnrollmentRequests.length === 0 ? (
                    <EmptyState text="لا توجد طلبات أو اشتراكات في منهاج الدارسين." />
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gap: "14px",
                        marginTop: "22px",
                      }}
                    >
                      {curriculumEnrollmentRequests.map((request) => (
                        <article
                          key={request.id}
                          style={{
                            padding: "18px",
                            border: "1px solid rgba(199,154,53,0.4)",
                            borderRadius: "16px",
                            background: "rgba(255,253,243,0.7)",
                          }}
                        >
                          <h3
                            style={{
                              margin: "0 0 8px",
                              color: colors.green,
                            }}
                          >
                            {request.fullName}
                          </h3>
                          <p style={{ margin: "0 0 6px" }}>
                            تاريخ الطلب:{" "}
                            {new Intl.DateTimeFormat("ar-JO", {
                              dateStyle: "long",
                            }).format(new Date(request.requestedAt))}
                          </p>
                          <p style={{ margin: "0 0 14px" }}>
                            الحالة:{" "}
                            {request.status === "approved"
                              ? "مشترك ✓"
                              : request.status === "rejected"
                                ? "مرفوض"
                                : "قيد المراجعة"}
                          </p>
                          {editingCurriculumEnrollment?.id === request.id && (
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "10px",
                                marginBottom: "14px",
                              }}
                            >
                              <select
                                aria-label={`حالة اشتراك ${request.fullName}`}
                                value={editingCurriculumEnrollment.status}
                                onChange={(event) => {
                                  const status = event.currentTarget.value;

                                  if (
                                    status === "pending" ||
                                    status === "approved" ||
                                    status === "rejected"
                                  ) {
                                    setEditingCurriculumEnrollment({
                                      id: request.id,
                                      status,
                                    });
                                  }
                                }}
                                style={{
                                  ...inputStyle,
                                  minWidth: "190px",
                                }}
                              >
                                <option value="pending">قيد المراجعة</option>
                                <option value="approved">مشترك</option>
                                <option value="rejected">مرفوض</option>
                              </select>
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() =>
                                  void handleCurriculumEnrollmentRequest(
                                    request,
                                    editingCurriculumEnrollment.status,
                                  )
                                }
                                style={buttonPrimary}
                              >
                                حفظ
                              </button>
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() =>
                                  setEditingCurriculumEnrollment(null)
                                }
                                style={buttonSecondary}
                              >
                                إلغاء
                              </button>
                            </div>
                          )}
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "10px",
                            }}
                          >
                            {request.status === "pending" && (
                              <>
                                <button
                                  type="button"
                                  disabled={pending}
                                  onClick={() =>
                                    void handleCurriculumEnrollmentRequest(
                                      request,
                                      "approved",
                                    )
                                  }
                                  style={buttonPrimary}
                                >
                                  قبول
                                </button>
                                <button
                                  type="button"
                                  disabled={pending}
                                  onClick={() =>
                                    void handleCurriculumEnrollmentRequest(
                                      request,
                                      "rejected",
                                    )
                                  }
                                  style={{
                                    ...buttonSecondary,
                                    color: "#8a2e2e",
                                  }}
                                >
                                  رفض
                                </button>
                              </>
                            )}
                            {editingCurriculumEnrollment?.id !== request.id && (
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() =>
                                  setEditingCurriculumEnrollment({
                                    id: request.id,
                                    status: request.status,
                                  })
                                }
                                style={buttonSecondary}
                              >
                                تعديل
                              </button>
                            )}
                            {confirmingCurriculumEnrollmentDelete !==
                              request.id && (
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() =>
                                  setConfirmingCurriculumEnrollmentDelete(
                                    request.id,
                                  )
                                }
                                style={{
                                  ...buttonSecondary,
                                  color: "#8a2e2e",
                                }}
                              >
                                حذف
                              </button>
                            )}
                          </div>
                          {confirmingCurriculumEnrollmentDelete ===
                            request.id && (
                            <div
                              role="group"
                              aria-label="تأكيد حذف الاشتراك"
                              style={{
                                marginTop: "14px",
                                padding: "14px",
                                border: "1px solid rgba(160,45,45,0.28)",
                                borderRadius: "14px",
                                background: "rgba(160,45,45,0.06)",
                              }}
                            >
                              <p style={{ margin: "0 0 12px", fontWeight: 800 }}>
                                هل أنت متأكد من حذف اشتراك هذا الطالب في منهاج
                                الدارسين؟
                              </p>
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: "10px",
                                }}
                              >
                                <button
                                  type="button"
                                  disabled={pending}
                                  onClick={() =>
                                    void deleteCurriculumEnrollment(request)
                                  }
                                  style={{
                                    ...buttonPrimary,
                                    background: "#8a2e2e",
                                  }}
                                >
                                  حذف
                                </button>
                                <button
                                  type="button"
                                  disabled={pending}
                                  onClick={() =>
                                    setConfirmingCurriculumEnrollmentDelete(
                                      null,
                                    )
                                  }
                                  style={buttonSecondary}
                                >
                                  إلغاء
                                </button>
                              </div>
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {panel === "support" && isAdminOne && (
              <section style={cardStyle}>
                <div
                  style={{
                    padding: "clamp(22px, 4vw, 34px)",
                  }}
                >
                  <SectionTitle
                    icon="📨"
                    title="الشكاوى وطلبات الدعم"
                    description="تابع طلبات الطلاب والمشرفين، وحدّث الحالة أو أرسل رد الإدارة."
                  />

                  {supportLoading ? (
                    <EmptyState text="جارٍ تحميل طلبات الدعم..." />
                  ) : supportError ? (
                    <p
                      role="alert"
                      style={{
                        marginTop: "22px",
                        color: "#8b3030",
                        fontWeight: 800,
                      }}
                    >
                      ⚠️ {supportError}
                    </p>
                  ) : supportRequests.length === 0 ? (
                    <EmptyState text="لا توجد شكاوى أو طلبات دعم حتى الآن." />
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gap: "14px",
                        marginTop: "22px",
                      }}
                    >
                      {supportRequests.map((request) => {
                        const expanded =
                          expandedSupportId === request.id;
                        const typeLabels = {
                          complaint: "شكوى",
                          technical: "مشكلة تقنية",
                          suggestion: "اقتراح",
                          question: "استفسار",
                          password_reset: "استعادة كلمة المرور",
                          other: "أخرى",
                        };
                        const statusLabels = {
                          pending: "جديدة",
                          in_progress: "قيد المعالجة",
                          resolved: "تم الحل",
                        };

                        return (
                          <article
                            key={request.id}
                            style={{
                              padding: "18px",
                              border: "1px solid rgba(199,154,53,0.4)",
                              borderRadius: "16px",
                              background: "rgba(255,253,243,0.7)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "12px",
                              }}
                            >
                              <div>
                                <h3
                                  style={{
                                    margin: "0 0 7px",
                                    color: colors.green,
                                  }}
                                >
                                  {request.title}
                                </h3>
                                <p style={{ margin: 0, lineHeight: 1.8 }}>
                                  صاحب الطلب: {request.requester_name} (
                                  {request.requester_role === "student"
                                    ? "طالب"
                                    : "مشرف"}
                                  )
                                  <br />
                                  النوع: {typeLabels[request.request_type]}
                                  <br />
                                  التاريخ:{" "}
                                  {new Intl.DateTimeFormat("ar-JO", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  }).format(new Date(request.created_at))}
                                </p>
                              </div>
                              <span
                                style={{
                                  padding: "6px 11px",
                                  borderRadius: "999px",
                                  background: "rgba(199,154,53,0.11)",
                                  color: colors.goldDark,
                                  fontWeight: 800,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {statusLabels[request.status]}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedSupportId(
                                  expanded ? null : request.id,
                                )
                              }
                              style={{
                                ...buttonSecondary,
                                minHeight: "40px",
                                marginTop: "14px",
                              }}
                            >
                              {expanded ? "إخفاء التفاصيل" : "فتح التفاصيل"}
                            </button>
                            {expanded && (
                              <div
                                style={{
                                  display: "grid",
                                  gap: "13px",
                                  marginTop: "14px",
                                  paddingTop: "14px",
                                  borderTop: "1px solid rgba(21,84,63,0.12)",
                                }}
                              >
                                <p
                                  style={{
                                    margin: 0,
                                    whiteSpace: "pre-wrap",
                                    lineHeight: 1.9,
                                  }}
                                >
                                  {request.message}
                                </p>
                                {request.request_type === "password_reset" && (
  <div
    style={{
      display: "grid",
      gap: "12px",
      padding: "16px",
      borderRadius: "14px",
      border: "1px solid rgba(199,154,53,0.35)",
      background: "rgba(199,154,53,0.06)",
    }}
  >
    <strong
      style={{
        color: colors.green,
        fontSize: "16px",
      }}
    >
      طلب اعتماد كلمة مرور جديدة
    </strong>

    {request.proposed_password ? (
      <>
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "10px",
            background: "rgba(255,255,255,0.7)",
            direction: "ltr",
            textAlign: "left",
            fontWeight: 800,
            letterSpacing: "1px",
          }}
        >
          {request.proposed_password}
        </div>

        {request.status === "pending" && (
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              disabled={supportSavingId === request.id}
              onClick={() =>
                handlePasswordResetAction(
                  request,
                  "approve_password_reset",
                )
              }
              style={{
                ...buttonPrimary,
                minHeight: "44px",
              }}
            >
              {supportSavingId === request.id
                ? "جارٍ المعالجة..."
                : "✓ الموافقة واعتماد كلمة المرور"}
            </button>

            <button
              type="button"
              disabled={supportSavingId === request.id}
              onClick={() =>
                handlePasswordResetAction(
                  request,
                  "reject_password_reset",
                )
              }
              style={{
                ...buttonSecondary,
                minHeight: "44px",
              }}
            >
              ✕ رفض الطلب
            </button>
          </div>
        )}
      </>
    ) : (
      <p
        style={{
          margin: 0,
          color: colors.muted,
        }}
      >
        تمت معالجة طلب استعادة كلمة المرور.
      </p>
    )}
  </div>
)}


                                
                                <label
                                  style={{
                                    color: colors.green,
                                    fontSize: "14px",
                                    fontWeight: 900,
                                  }}
                                >
                                  الحالة
                                  <select
                                    disabled={
                                      supportSavingId === request.id
                                    }
                                    value={
                                      supportStatusDrafts[request.id] ??
                                      request.status
                                    }
                                    onChange={(event) => {
                                      const status = event.currentTarget.value;
                                      if (
                                        status === "pending" ||
                                        status === "in_progress" ||
                                        status === "resolved"
                                      ) {
                                        setSupportStatusDrafts((current) => ({
                                          ...current,
                                          [request.id]: status,
                                        }));
                                      }
                                    }}
                                    style={{
                                      ...inputStyle,
                                      display: "block",
                                      width: "100%",
                                      marginTop: "7px",
                                    }}
                                  >
                                    <option value="pending">
                                      بانتظار المراجعة
                                    </option>
                                    <option value="in_progress">
                                      قيد المعالجة
                                    </option>
                                    <option value="resolved">تم الحل</option>
                                  </select>
                                </label>
                                <label
                                  style={{
                                    color: colors.green,
                                    fontSize: "14px",
                                    fontWeight: 900,
                                  }}
                                >
                                  رد الإدارة
                                  <textarea
                                    disabled={
                                      supportSavingId === request.id
                                    }
                                    rows={4}
                                    maxLength={5000}
                                    value={
                                      supportReplyDrafts[request.id] ??
                                      request.admin_reply ??
                                      ""
                                    }
                                    onChange={(event) => {
                                      const reply =
                                        event.currentTarget.value;
                                      setSupportReplyDrafts((current) => ({
                                        ...current,
                                        [request.id]: reply,
                                      }));
                                    }}
                                    style={{
                                      ...inputStyle,
                                      display: "block",
                                      width: "100%",
                                      marginTop: "7px",
                                      resize: "vertical",
                                    }}
                                  />
                                </label>
                                <button
                                  type="button"
                                  disabled={
                                    supportSavingId === request.id
                                  }
                                  onClick={() =>
                                    void saveSupportRequest(request)
                                  }
                                  style={{
                                    ...buttonPrimary,
                                    justifySelf: "start",
                                  }}
                                >
                                  {supportSavingId === request.id
                                    ? "جارٍ الحفظ..."
                                    : "حفظ التحديث والرد"}
                                </button>
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            )}

            {panel === "supervisors" &&
              isAdminOne && (
                <section style={cardStyle}>
                <div
                  style={{
                    padding:
                      "clamp(22px, 4vw, 34px)",
                  }}
                >
                  <SectionTitle
                    icon="👥"
                    title="👥 المشرفون"
                    description="ملف المشرف الكامل، حالة الحساب، الطلاب المسندين إليه، وإدارة كلمة المرور — Admin 1 فقط."
                  />

                  {isAdminOne && (
                    <form
                      onSubmit={
                        saveSupervisor
                      }
                      style={{
                        marginTop: "25px",
                        padding: "20px",
                        borderRadius: "22px",
                        background:
                          "rgba(255,255,255,0.35)",
                        border:
                          "1px solid rgba(199,154,53,0.22)",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(230px, 1fr))",
                          gap: "15px",
                        }}
                      >
                        <Field label="اسم المشرف">
                          <input
                            autoComplete="off"
                            maxLength={120}
                            onChange={(event) =>
                              setFullNameInput(
                                event.target.value,
                              )
                            }
                            required
                            value={
                              fullNameInput
                            }
                            style={
                              inputStyle
                            }
                          />
                        </Field>

                        <Field label="رقم الهاتف">
  <input
    autoComplete="tel"
    inputMode="tel"
    type="tel"
    value={phone}
    onChange={(event) =>
      setPhone(event.target.value)
    }
    placeholder="07XXXXXXXX"
    required
    style={inputStyle}
  />
</Field>

<Field label="كلمة المرور">
  <input
    autoComplete="new-password"
    type="password"
    value={password}
    onChange={(event) =>
      setPassword(event.target.value)
    }
    placeholder="أدخل كلمة المرور"
    required
    style={inputStyle}
  />
</Field>
                      </div>

                      <fieldset
                        style={{
                          margin:
                            "18px 0 0",
                          padding: "15px",
                          borderRadius: "18px",
                          border:
                            "1px solid rgba(199,154,53,0.28)",
                        }}
                      >
                        <legend
                          style={{
                            padding:
                              "0 8px",
                            color:
                              colors.green,
                            fontSize:
                              "14px",
                            fontWeight: 900,
                          }}
                        >
                          الصلاحية
                        </legend>

                        <div
                          style={{
                            display: "flex",
                            flexWrap:
                              "wrap",
                            gap: "12px",
                          }}
                        >
                          <RadioOption
                            checked={
                              permission ===
                              "supervisor"
                            }
                            onChange={() =>
                              setPermission(
                                "supervisor",
                              )
                            }
                            text="مشرف فقط"
                          />

                          <RadioOption
                            checked={
                              permission ===
                              "manager-supervisor"
                            }
                            onChange={() =>
                              setPermission(
                                "manager-supervisor",
                              )
                            }
                            text="إدارة + مشرف"
                          />
                        </div>
                      </fieldset>

                      <div
                        style={{
                          display:
                            "flex",
                          flexWrap:
                            "wrap",
                          gap: "9px",
                          marginTop:
                            "20px",
                        }}
                      >
                        <button
                          style={{
                            ...buttonPrimary,
                            opacity:
                              pending
                                ? 0.6
                                : 1,
                          }}
                          disabled={
                            pending
                          }
                          type="submit"
                        >
                          {pending
                            ? "جارٍ الحفظ..."
                            : "＋ إضافة مشرف"}
                        </button>
                      </div>
                    </form>
                  )}

                  <DataTable
                    headers={[
                   "الاسم",
"رقم الهاتف",
"الصلاحية",
"الحالة",
"إجراء",
                    ]}
                  >
                    {supervisors.map(
                      (supervisor) => (
                        <tr
                          key={
                            supervisor.id
                          }
                        >
                          <td>{supervisor.full_name}</td>

                          <td dir="ltr">
                            {supervisor.phone ?? "غير متوفر"}
                          </td>

                          <td>
                            <StatusPill>
                              {supervisor.can_manage
                                ? "إدارة + مشرف"
                                : "مشرف فقط"}
                            </StatusPill>
                          </td>

                          <td>
                            <StatusPill
                              success={
                                supervisor.is_active
                              }
                            >
                              {supervisor.is_active
                                ? "نشط"
                                : "غير نشط"}
                            </StatusPill>
                          </td>

                          <td>
                            {isAdminOne && (
                              <div
                                style={{
                                  display:
                                    "flex",
                                  flexWrap:
                                    "wrap",
                                  gap: "7px",
                                }}
                              >
                                <button
                                  style={buttonSecondary}
                                  onClick={() =>
                                    setSelectedSupervisorForProfile(supervisor)
                                  }
                                  type="button"
                                >
                                  الملف الكامل
                                </button>

                                <button
                                  style={{
                                    ...buttonSecondary,
                                    color:
                                      "#8a3030",
                                    borderColor:
                                      "rgba(150,45,45,0.35)",
                                  }}
                                  disabled={
                                    pending
                                  }
                                  onClick={() =>
                                    void deleteSupervisor(
                                      supervisor,
                                    )
                                  }
                                  type="button"
                                >
                                  حذف
                                </button>
                              </div>
                            )}

                            {!isAdminOne && (
                              <span
                                style={
                                  hintStyle
                                }
                              >
                                للعرض فقط
                              </span>
                            )}
                          </td>
                        </tr>
                      ),
                    )}
                  </DataTable>

                  {supervisors.length ===
                    0 && (
                    <EmptyState text="لا يوجد مشرفون مضافون حاليًا." />
                  )}
                </div>
              </section>
            )}

            {panel === "students" && (
              <section style={cardStyle}>
                <div
                  style={{
                    padding:
                      "clamp(22px, 4vw, 34px)",
                  }}
                >
                  <SectionTitle
                    icon="🎓"
                    title="إدارة الطلاب"
                    description="جميع الطلاب المسجلين في المشروع ومعلومات الإسناد والمتابعة."
                  />

                  {isAdminOne && (
                    <form
                      onSubmit={saveStudent}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                        gap: "12px",
                        marginTop: "20px",
                        padding: "18px",
                        borderRadius: "18px",
                        background: "rgba(21,84,63,0.06)",
                        border: "1px solid rgba(21,84,63,0.14)",
                      }}
                    >
                      <Field label="اسم الطالب">
                        <input
                          required
                          maxLength={120}
                          value={studentName}
                          onChange={(event) => setStudentName(event.target.value)}
                          style={inputStyle}
                        />
                      </Field>
                      <Field label="المسار">
                        <select
                          value={track}
                          onChange={(event) => setTrack(event.target.value as TrackName)}
                          style={inputStyle}
                        >
                          {TRACKS.map((item) => (
                            <option key={item.name} value={item.name}>{item.name}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="الخطة الحالية">
                        <input
                          required
                          maxLength={240}
                          value={currentPlan}
                          onChange={(event) => setCurrentPlan(event.target.value)}
                          style={inputStyle}
                        />
                      </Field>
                      <Field label="المشرف">
                        <select
                          required
                          value={supervisorId}
                          onChange={(event) => setSupervisorId(event.target.value)}
                          style={inputStyle}
                        >
                          <option value="">اختر مشرفًا نشطًا</option>
                          {activeSupervisors.map((item) => (
                            <option key={item.id} value={item.id}>{item.full_name}</option>
                          ))}
                        </select>
                      </Field>
                      <div style={{ gridColumn: "1 / -1", color: colors.muted, fontSize: "12px" }}>
                        محتوى المسار: {trackContent}
                      </div>
                      <button
                        type="submit"
                        disabled={pending || activeSupervisors.length === 0}
                        style={{ ...buttonPrimary, justifySelf: "start" }}
                      >
                        {pending ? "جارٍ إضافة الطالب..." : "إضافة طالب"}
                      </button>
                    </form>
                  )}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(170px, 1fr))",
                      gap: "12px",
                      marginTop: "22px",
                    }}
                  >
                    <div
                      style={{
                        padding: "18px",
                        borderRadius: "20px",
                        background:
                          "rgba(21,84,63,0.07)",
                        border:
                          "1px solid rgba(21,84,63,0.14)",
                      }}
                    >
                      <div
                        style={{
                          color: colors.muted,
                          fontSize: "12px",
                          fontWeight: 800,
                        }}
                      >
                        إجمالي الطلاب
                      </div>

                      <strong
                        style={{
                          display: "block",
                          marginTop: "5px",
                          color: colors.green,
                          fontSize: "30px",
                          fontWeight: 900,
                        }}
                      >
                        {students.length}
                      </strong>
                    </div>

                    <div
                      style={{
                        padding: "18px",
                        borderRadius: "20px",
                        background:
                          "rgba(199,154,53,0.08)",
                        border:
                          "1px solid rgba(199,154,53,0.18)",
                      }}
                    >
                      <div
                        style={{
                          color: colors.muted,
                          fontSize: "12px",
                          fontWeight: 800,
                        }}
                      >
                        الظاهر حاليًا
                      </div>

                      <strong
                        style={{
                          display: "block",
                          marginTop: "5px",
                          color: colors.goldDark,
                          fontSize: "30px",
                          fontWeight: 900,
                        }}
                      >
                        {filteredStudents.length}
                      </strong>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "minmax(220px, 1fr) minmax(180px, 260px)",
                      gap: "12px",
                      marginTop: "22px",
                    }}
                  >
                    <Field label="البحث عن طالب">
                      <input
                        type="search"
                        value={studentSearch}
                        onChange={(event) =>
                          setStudentSearch(
                            event.target.value,
                          )
                        }
                        placeholder="اكتب اسم الطالب..."
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="فلترة حسب المسار">
                      <select
                        value={
                          studentTrackFilter
                        }
                        onChange={(event) =>
                          setStudentTrackFilter(
                            event.target.value as
                              | "all"
                              | TrackName,
                          )
                        }
                        style={inputStyle}
                      >
                        <option value="all">
                          جميع المسارات
                        </option>

                        {TRACKS.map(
                          (item) => (
                            <option
                              key={
                                item.name
                              }
                              value={
                                item.name
                              }
                            >
                              {
                                item.name
                              }
                            </option>
                          ),
                        )}
                      </select>
                    </Field>

                    <button
                      type="button"
                      onClick={downloadStudentsExcel}
                      disabled={exportingStudents}
                      style={{
                        ...buttonPrimary,
                        gridColumn: "1 / -1",
                        justifySelf: "start",
                        opacity: exportingStudents ? 0.7 : 1,
                      }}
                    >
                      {exportingStudents
                        ? "جارٍ تجهيز الملف..."
                        : "تنزيل معلومات الطلاب"}
                    </button>
                  </div>

                  <div
                    style={{
                      marginTop: "28px",
                    }}
                  >
                    {filteredStudents.length ===
                    0 ? (
                      <EmptyState
                        text={
                          students.length === 0
                            ? "لا يوجد طلاب مسجلون حاليًا."
                            : "لا يوجد طالب يطابق البحث أو الفلتر المحدد."
                        }
                      />
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(300px, 1fr))",
                          gap: "14px",
                        }}
                      >
                        {filteredStudents.map(
                          (student) => {
                            const supervisor =
                              student.supervisor;

                            return (
                              <article
                                key={
                                  student.id
                                }
                                role={
                                  isAdminOne
                                    ? "button"
                                    : undefined
                                }
                                tabIndex={
                                  isAdminOne
                                    ? 0
                                    : undefined
                                }
                                onClick={() => {
                                  if (isAdminOne) {
                                    window.location.href = `/management/students/${student.id}`;
                                  }
                                }}
                                onKeyDown={(event) => {
                                  if (
                                    isAdminOne &&
                                    (event.key === "Enter" ||
                                      event.key === " ")
                                  ) {
                                    event.preventDefault();
                                    window.location.href = `/management/students/${student.id}`;
                                  }
                                }}
                                style={{
                                  position:
                                    "relative",
                                  cursor: isAdminOne ? "pointer" : "default",
                                  overflow:
                                    "hidden",
                                  padding:
                                    "20px",
                                  borderRadius:
                                    "22px",
                                  background:
                                    "linear-gradient(145deg, rgba(255,253,243,0.82), rgba(237,242,228,0.72))",
                                  border:
                                    "1px solid rgba(199,154,53,0.28)",
                                  boxShadow:
                                    "0 10px 28px rgba(5,35,24,0.07)",
                                }}
                              >
                                <div
                                  aria-hidden="true"
                                  style={{
                                    position:
                                      "absolute",
                                    top: "-35px",
                                    left: "-35px",
                                    width:
                                      "100px",
                                    height:
                                      "100px",
                                    borderRadius:
                                      "50%",
                                    border:
                                      "1px solid rgba(199,154,53,0.20)",
                                  }}
                                />

                                <div
                                  style={{
                                    position:
                                      "relative",
                                    zIndex: 1,
                                  }}
                                >
                                  <div
                                    style={{
                                      display:
                                        "flex",
                                      alignItems:
                                        "center",
                                      justifyContent:
                                        "space-between",
                                      gap: "12px",
                                      marginBottom:
                                        "18px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display:
                                          "flex",
                                        alignItems:
                                          "center",
                                        gap: "11px",
                                      }}
                                    >
                                      <div
                                        style={{
                                          width:
                                            "48px",
                                          height:
                                            "48px",
                                          flexShrink: 0,
                                          borderRadius:
                                            "15px",
                                          display:
                                            "flex",
                                          alignItems:
                                            "center",
                                          justifyContent:
                                            "center",
                                          background:
                                            "linear-gradient(135deg, rgba(21,84,63,0.13), rgba(199,154,53,0.16))",
                                          border:
                                            "1px solid rgba(199,154,53,0.25)",
                                          fontSize:
                                            "23px",
                                        }}
                                      >
                                        🎓
                                      </div>

                                      <div>
                                        <h3
                                          style={{
                                            margin:
                                              0,
                                            color:
                                              colors.green,
                                            fontSize:
                                              "18px",
                                            fontWeight:
                                              900,
                                            lineHeight:
                                              1.4,
                                          }}
                                        >
                                          {
                                            student.full_name
                                          }
                                        </h3>

                                        <span
                                          style={{
                                            display:
                                              "block",
                                            marginTop:
                                              "3px",
                                            color:
                                              colors.muted,
                                            fontSize:
                                              "11px",
                                            fontWeight:
                                              600,
                                          }}
                                        >
                                          طالب مسجل
                                          في
                                          المشروع
                                        </span>
                                      </div>
                                    </div>

                                    <StatusPill
                                      success
                                    >
                                      نشط
                                    </StatusPill>
                                  </div>

                                  <div
                                    style={{
                                      display:
                                        "grid",
                                      gap: "9px",
                                    }}
                                  >
                                    <StudentInfoRow
                                      icon="🛤️"
                                      label="المسار"
                                      value={
                                        student.track
                                      }
                                    />

                                    <StudentInfoRow
                                      icon="📖"
                                      label="الخطة الحالية"
                                      value={
                                        student.current_plan ||
                                        "لم تحدد بعد"
                                      }
                                    />

                                    <StudentInfoRow
                                      icon="👨‍🏫"
                                      label="المشرف المسؤول"
                                      value={
                                        supervisor?.full_name ??
                                        "غير مسند"
                                      }
                                    />

                                    <StudentInfoRow
                                      icon="📅"
                                      label="آخر تسميع"
                                      value={
                                        student.last_recitation
                                          ? formatRecitationRange(
                                              {
                                                startSurah:
                                                  student.last_recitation.start_surah ??
                                                  undefined,
                                                startAyah:
                                                  student.last_recitation.start_ayah ??
                                                  undefined,
                                                endSurah:
                                                  student.last_recitation.end_surah ??
                                                  undefined,
                                                endAyah:
                                                  student.last_recitation.end_ayah ??
                                                  undefined,
                                              },
                                            )
                                          : "لم يتم التسميع بعد"
                                      }
                                    />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "9px",
            marginTop: "9px",
          }}
        >
          <StudentInfoRow
            icon="⭐"
            label="النقاط"
            value={`${Number(student.points ?? 0).toFixed(2)} نقطة`}
          />

          <StudentInfoRow
            icon="🏆"
            label="الترتيب"
            value={
              student.rank
                ? `المركز ${student.rank}`
                : "غير مصنف"
            }
          />
        </div>

                                  </div>
                                </div>
                              </article>
                            );
                          },
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {panel === "history" && (
              <section style={cardStyle}>
                <div
                  style={{
                    padding:
                      "clamp(22px, 4vw, 34px)",
                  }}
                >
                  <SectionTitle
                    icon="📖"
                    title="سجل التسميع"
                    description="الجلسات المسجلة مرتبة من الأحدث."
                  />

                  {sessions.length ===
                  0 ? (
                    <EmptyState text="لا توجد جلسات تسميع مسجلة." />
                  ) : (
                    <DataTable
                      headers={[
                        "التاريخ",
                        "الطالب",
                        "المشرف",
                        "المسار والخطة",
                        "النتيجة والتفاصيل",
                        "الإجراءات",
                      ]}
                    >
                      {sessions.map(
                        (session) => (
                          <tr
                            key={
                              session.id
                            }
                          >
                            <td>
                              {new Date(
                                session.created_at,
                              ).toLocaleString(
                                "ar",
                              )}
                            </td>

                            <td>
                              {
                                students.find(
                                  (item) =>
                                    item.id ===
                                    session.student_id,
                                )
                                  ?.full_name ??
                                "—"
                              }
                            </td>

                            <td>
                              {
                                supervisors.find(
                                  (item) =>
                                    item.id ===
                                    session.supervisor_id,
                                )
                                  ?.full_name ??
                                "—"
                              }
                            </td>

                            <td>
                              <strong>
                                {
                                  session.track
                                }
                              </strong>

                              <span
                                style={{
                                  ...hintStyle,
                                  display:
                                    "block",
                                  marginTop:
                                    "4px",
                                }}
                              >
                                {
                                  session.plan
                                }
                              </span>
                            </td>

                            <td>
                              <StatusPill
                                success={
                                  session.status ===
                                  "تم التسميع"
                                }
                              >
                                {
                                  session.status
                                }
                              </StatusPill>

                              <span
                                style={{
                                  ...hintStyle,
                                  display:
                                    "block",
                                  marginTop:
                                    "6px",
                                }}
                              >
                                {session.recitation_details ??
                                  session.not_recited_reason ??
                                  "—"}
                              </span>
                            </td>

                            <td>
                              <div
                                style={{
                                  display:
                                    "flex",
                                  flexWrap:
                                    "wrap",
                                  gap: "7px",
                                }}
                              >
                                <button
                                  style={
                                    buttonSecondary
                                  }
                                  onClick={() =>
                                    setEditingSession(
                                      session,
                                    )
                                  }
                                  type="button"
                                >
                                  تعديل
                                </button>

                                <button
                                  style={{
                                    ...buttonSecondary,
                                    color:
                                      "#8a3030",
                                    borderColor:
                                      "rgba(150,45,45,0.35)",
                                  }}
                                  disabled={
                                    pending
                                  }
                                  onClick={() =>
                                    void deleteSession(
                                      session,
                                    )
                                  }
                                  type="button"
                                >
                                  حذف
                                </button>
                              </div>
                            </td>
                          </tr>
                        ),
                      )}
                    </DataTable>
                  )}
                </div>
              </section>
            )}

            {panel === "accounts" &&
              isAdminOne && (
                <section
                  style={{
                    ...cardStyle,
                    marginTop: "20px",
                  }}
                >
                  <div
                    style={{
                      padding:
                        "clamp(22px, 4vw, 34px)",
                    }}
                  >
                    <SectionTitle
                      icon="🗃️"
                      title="الحسابات المحذوفة"
                      description="إدارة حسابات الطلاب المحذوفة — يمكن استعادتها أو حذفها نهائيًا."
                    />

                    {deletedStudents.length === 0 ? (
                      <EmptyState text="لا توجد حسابات محذوفة." />
                    ) : (
                      <DataTable
                        headers={[
                          "اسم الطالب",
                          "رقم الهاتف",
                          "المسار",
                          "حالة الحساب",
                          "الإجراءات",
                        ]}
                      >
                        {deletedStudents.map((student) => (
                          <tr key={student.id}>
                            <td>
                              <strong>{student.full_name}</strong>
                            </td>
                            <td>{student.phone || "—"}</td>
                            <td>{student.track}</td>
                            <td>
                              <StatusPill success={false}>
                                محذوف
                              </StatusPill>
                            </td>
                            <td>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <button
                                  type="button"
                                  disabled={pending}
                                  onClick={() =>
                                    void restoreDeletedStudent(student)
                                  }
                                  style={buttonSecondary}
                                >
                                  استعادة
                                </button>
                                <button
                                  type="button"
                                  disabled={pending}
                                  onClick={() =>
                                    void permanentlyDeleteStudent(student)
                                  }
                                  style={{
                                    ...buttonSecondary,
                                    borderColor: "#a83232",
                                    background: "#fff0ed",
                                    color: "#8f2020",
                                  }}
                                >
                                  حذف نهائي
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </DataTable>
                    )}
                  </div>
                </section>
              )}
          </>
        )}

        {selectedStudentProfile && isAdminOne && (
          <ManagementStudentProfileModal
            student={selectedStudentProfile}
            supervisors={supervisorOptions}
            canEdit={isAdminOne}
            onClose={() => setSelectedStudentProfile(null)}
            onSaved={() => {
              setSelectedStudentProfile(null);
              setNotice("تم حفظ ملف الطالب.");
              void loadData();
            }}
            onDelete={() => void handleDeleteStudentAccount(selectedStudentProfile)}
          />
        )}

        {selectedSupervisorForProfile && isAdminOne && (
          <ManagementSupervisorProfileModal
            supervisor={selectedSupervisorForProfile}
            onClose={() => setSelectedSupervisorForProfile(null)}
            onSaved={() => {
              setSelectedSupervisorForProfile(null);
              setNotice("تم حفظ ملف المشرف.");
              void loadData();
            }}
            onOpenStudent={(studentId) => {
              const student = students.find((item) => item.id === studentId);
              if (!student) {
                setError("الطالب غير موجود ضمن قائمة الطلاب النشطين.");
                return;
              }
              setSelectedSupervisorForProfile(null);
              setSelectedStudentProfile(student);
            }}
          />
        )}

        {editingSession && (
          <RecitationSessionEditor
            endpoint="/api/management/sessions"
            onClose={() =>
              setEditingSession(null)
            }
            onSaved={(updated) => {
              setSessions(
                (current) =>
                  current.map(
                    (item) =>
                      item.id ===
                      updated.id
                        ? updated
                        : item,
                  ),
              );

              setEditingSession(null);

              setNotice(
                "تم تحديث جلسة التسميع.",
              );

              setError("");
            }}
            session={editingSession}
            students={students}
          />
        )}
      </div>

      <footer
        style={{
          position: "relative",
          zIndex: 2,
          padding:
            "0 16px 25px",
          textAlign: "center",
          color:
            "rgba(255,247,216,0.90)",
          fontSize: "12px",
          fontWeight: 600,
          textShadow:
            "0 2px 8px rgba(0,0,0,0.35)",
        }}
      >
        مشروع فالتسموا نورًا القرآني
      </footer>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "52px",
  boxSizing: "border-box",
  marginTop: "7px",
  padding: "11px 14px",
  borderRadius: "15px",
  border:
    "1.5px solid rgba(199,154,53,0.48)",
  background:
    "rgba(255,253,244,0.82)",
  color: colors.green,
  fontSize: "15px",
  fontWeight: 700,
  outline: "none",
};

const hintStyle: React.CSSProperties = {
  color: colors.muted,
  fontSize: "12px",
  lineHeight: 1.7,
  fontWeight: 600,
};

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "18px",
          background:
            "linear-gradient(135deg, rgba(21,84,63,0.12), rgba(199,154,53,0.13))",
          border:
            "1px solid rgba(199,154,53,0.30)",
          fontSize: "25px",
        }}
      >
        {icon}
      </div>

      <div>
        <h2
          style={{
            margin: 0,
            color: colors.green,
            fontSize:
              "clamp(22px, 4vw, 30px)",
            fontWeight: 900,
            lineHeight: 1.3,
          }}
        >
          {title}
        </h2>

        <p
          style={{
            margin:
              "5px 0 0",
            color: colors.muted,
            fontSize: "13px",
            fontWeight: 600,
            lineHeight: 1.7,
          }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label
      style={{
        display: "block",
        color: colors.green,
        fontSize: "14px",
        fontWeight: 900,
      }}
    >
      {label}
      {children}
    </label>
  );
}

function RadioOption({
  checked,
  onChange,
  text,
}: {
  checked: boolean;
  onChange: () => void;
  text: string;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 14px",
        borderRadius: "13px",
        background: checked
          ? "rgba(21,84,63,0.10)"
          : "rgba(255,255,255,0.30)",
        border: checked
          ? "1px solid rgba(21,84,63,0.25)"
          : "1px solid transparent",
        color: colors.green,
        fontSize: "14px",
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      <input
        checked={checked}
        onChange={onChange}
        type="radio"
      />

      {text}
    </label>
  );
}

function StudentInfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "34px minmax(0, 1fr)",
        alignItems: "center",
        gap: "7px",
        minHeight: "42px",
        padding: "7px 9px",
        borderRadius: "13px",
        background:
          "rgba(255,255,255,0.38)",
        border:
          "1px solid rgba(21,84,63,0.07)",
      }}
    >
      <span
        style={{
          width: "30px",
          height: "30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "9px",
          background:
            "rgba(199,154,53,0.10)",
          fontSize: "15px",
        }}
      >
        {icon}
      </span>

      <span
        style={{
          color: colors.muted,
          fontSize: "11px",
          fontWeight: 800,
        }}
      >
        {label}
      </span>

      <strong
        style={{
          color: colors.text,
          fontSize: "12px",
          fontWeight: 800,
          lineHeight: 1.6,
          textAlign: "right",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function StatusPill({
  children,
  success = false,
}: {
  children: React.ReactNode;
  success?: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "5px 10px",
        borderRadius: "999px",
        background: success
          ? "rgba(34,120,82,0.10)"
          : "rgba(199,154,53,0.11)",
        border: success
          ? "1px solid rgba(34,120,82,0.20)"
          : "1px solid rgba(199,154,53,0.25)",
        color: success
          ? colors.green
          : colors.goldDark,
        fontSize: "12px",
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div
      style={{
        marginTop: "24px",
        padding: "35px 20px",
        textAlign: "center",
        borderRadius: "20px",
        background:
          "rgba(255,255,255,0.30)",
        border:
          "1px dashed rgba(199,154,53,0.40)",
        color: colors.muted,
        fontSize: "14px",
        fontWeight: 700,
      }}
    >
      <div
        style={{
          fontSize: "27px",
          marginBottom: "8px",
        }}
      >
        🌿
      </div>

      {text}
    </div>
  );
}

function DataTable({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
        marginTop: "26px",
        borderRadius: "20px",
        border:
          "1px solid rgba(199,154,53,0.25)",
        background:
          "rgba(255,255,255,0.27)",
      }}
    >
      <table
        style={{
          width: "100%",
          minWidth: "680px",
          borderCollapse: "collapse",
          color: colors.text,
          fontSize: "13px",
        }}
      >
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                style={{
                  padding:
                    "14px 13px",
                  textAlign: "right",
                  background:
                    "rgba(21,84,63,0.08)",
                  color:
                    colors.green,
                  fontSize:
                    "12px",
                  fontWeight:
                    900,
                  borderBottom:
                    "1px solid rgba(199,154,53,0.25)",
                  whiteSpace:
                    "nowrap",
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {children}
        </tbody>
      </table>

      <style jsx>{`
        tbody tr {
          border-bottom: 1px solid
            rgba(199, 154, 53, 0.14);
        }

        tbody tr:last-child {
          border-bottom: none;
        }

        tbody td {
          padding: 14px 13px;
          vertical-align: middle;
        }
      `}</style>


</div>
  );

}
