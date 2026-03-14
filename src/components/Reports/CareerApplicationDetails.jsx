import React, { useEffect, useMemo } from "react";
import {
  FaCalendarAlt,
  FaCheck,
  FaChevronDown,
  FaClipboardList,
  FaFilePdf,
  FaLink,
  FaPaperPlane,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";

const formatCurrency = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(parsed);
};

const CareerApplicationDetails = ({
  open,
  onClose,
  detail,
  hiringSteps = [],
  educationSections = [],
  formatDate,
  formatDateTime,
  normalizeLabelValue,
  getInitials,
  updateDraft,
  sendHiringAction,
  toIsoDateTime,
}) => {
  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const row = detail?.row;

  const education = useMemo(() => {
    if (row?.education && typeof row.education === "object") {
      return row.education;
    }
    return {};
  }, [row?.education]);

  const educationBlocks = useMemo(
    () =>
      row
        ? educationSections.map((section) => {
          const data = education?.[section.key] || {};
          const values = section.fields.map((field) => ({
            label: field.label,
            value: normalizeLabelValue(data?.[field.key]),
          }));
          const hasValue = values.some((item) => item.value !== "-");
          return { label: section.label, values, hasValue };
        })
        : [],
    [education, educationSections, normalizeLabelValue],
  );

  if (!open || !row) return null;

  const status = detail.status || "new";
  const meta = detail.meta || {};
  const actionDraft = detail.actionDraft || {};
  const timeZone = detail.timeZone || "UTC";
  const actionSending = detail.actionSending || {};

  const assignmentPdfValue = detail.assignmentPdfValue ?? "";
  const assignmentDueValue = detail.assignmentDueValue ?? "";
  const interviewMeetValue = detail.interviewMeetValue ?? "";
  const interviewScheduleValue = detail.interviewScheduleValue ?? "";
  const hrScheduleValue = detail.hrScheduleValue ?? "";
  const offerPdfValue = detail.offerPdfValue ?? "";

  const assignmentSubjectValue =
    actionDraft.assignmentSubject !== undefined
      ? actionDraft.assignmentSubject
      : "";
  const assignmentMessageValue =
    actionDraft.assignmentMessage !== undefined
      ? actionDraft.assignmentMessage
      : row.assignment_notes || "";
  const interviewSubjectValue =
    actionDraft.interviewSubject !== undefined
      ? actionDraft.interviewSubject
      : "";
  const interviewMessageValue =
    actionDraft.interviewMessage !== undefined
      ? actionDraft.interviewMessage
      : row.interview_notes || "";
  const hrSubjectValue =
    actionDraft.hrSubject !== undefined ? actionDraft.hrSubject : "";
  const hrMessageValue =
    actionDraft.hrMessage !== undefined
      ? actionDraft.hrMessage
      : row.hr_notes || "";
  const offerSubjectValue =
    actionDraft.offerSubject !== undefined ? actionDraft.offerSubject : "";
  const offerMessageValue =
    actionDraft.offerMessage !== undefined
      ? actionDraft.offerMessage
      : row.offer_notes || "";

  const stepIndex = Math.max(
    0,
    hiringSteps.findIndex((step) => step.key === status),
  );
  const stepProgress =
    hiringSteps.length > 1
      ? Math.min((stepIndex / (hiringSteps.length - 1)) * 100, 100)
      : 0;
  const isRejected = status === "rejected";

  const timelineItems = [
    { label: "Applied on", value: formatDateTime(row.created_at) },
    {
      label: "Application date",
      value: formatDate(row.application_date),
    },
    { label: "Assignment due", value: formatDate(row.assignment_due_date) },
    {
      label: "Interview scheduled",
      value: formatDateTime(row.interview_scheduled_at),
    },
    { label: "HR round", value: formatDateTime(row.hr_scheduled_at) },
    { label: "Last updated", value: formatDateTime(row.updated_at) },
  ].filter((item) => item.value && item.value !== "-");

  const noteItems = [
    { label: "Assignment notes", value: row.assignment_notes },
    { label: "Interview notes", value: row.interview_notes },
    { label: "HR notes", value: row.hr_notes },
    { label: "Offer notes", value: row.offer_notes },
  ].filter((item) => String(item.value || "").trim().length);

  const applicantName =
    `${row.first_name || ""} ${row.last_name || ""}`.trim() || "Applicant";
  const initials = getInitials(row.first_name, row.last_name);

  const handleAssignmentSend = () =>
    sendHiringAction(row.id, "assignment", {
      subject: assignmentSubjectValue,
      message: assignmentMessageValue,
      pdf_url: assignmentPdfValue,
      due_date: assignmentDueValue,
    });

  const handleInterviewSend = () =>
    sendHiringAction(row.id, "interview", {
      subject: interviewSubjectValue,
      message: interviewMessageValue,
      meet_link: interviewMeetValue,
      scheduled_at: interviewScheduleValue
        ? toIsoDateTime(interviewScheduleValue)
        : undefined,
      time_zone: timeZone,
    });

  const handleHrSend = () =>
    sendHiringAction(row.id, "hr", {
      subject: hrSubjectValue,
      message: hrMessageValue,
      scheduled_at: hrScheduleValue ? toIsoDateTime(hrScheduleValue) : undefined,
      time_zone: timeZone,
    });

  const handleOfferSend = () =>
    sendHiringAction(row.id, "offer", {
      subject: offerSubjectValue,
      message: offerMessageValue,
      offer_url: offerPdfValue,
    });

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Close details"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <aside className="relative ml-auto flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl">
        <div className="border-b border-gray-200 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="h-12 w-12 shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                {initials}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Applicant
                </p>
                <h2 className="text-xl font-bold text-gray-900">
                  {applicantName}
                </h2>
                <p className="text-sm text-gray-600">
                  {row.email || "-"} | {row.phone || "-"}
                </p>
                <p className="text-sm text-gray-500">
                  {row.role || "-"} | {row.preferred_location || "-"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${meta.chip}`}
              >
                {meta.label || "New"}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100"
              >
                <FaTimes />
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-5 sm:p-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Hiring Flow
                  </p>
                  <p className="text-sm text-gray-700">
                    Current stage:{" "}
                    <span className="font-semibold text-gray-900">
                      {meta.label || "New"}
                    </span>
                    {isRejected ? " - Rejected" : ""}
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  Updated {formatDateTime(row.updated_at)}
                </span>
              </div>
              <div className="relative mt-6">
                <div className="absolute left-4 right-4 top-4 h-0.5 rounded-full bg-gray-200" />
                <div
                  className={`absolute left-4 top-4 h-0.5 rounded-full ${
                    isRejected ? "bg-red-400" : "bg-blue-500"
                  }`}
                  style={{ width: `${isRejected ? 0 : stepProgress}%` }}
                />
                <div className="relative flex items-center justify-between gap-3 overflow-x-auto pb-2">
                  {hiringSteps.map((step, index) => {
                    const isComplete = !isRejected && index < stepIndex;
                    const isActive = !isRejected && index === stepIndex;
                    return (
                      <div
                        key={step.key}
                        className="flex min-w-[72px] flex-col items-center text-center"
                      >
                        <span
                          className={`text-[11px] font-semibold uppercase tracking-wide ${
                            isActive
                              ? "text-blue-700"
                              : isComplete
                                ? "text-blue-600"
                                : "text-gray-400"
                          }`}
                        >
                          {step.label}
                        </span>
                        <div
                          className={`mt-2 flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                            isComplete
                              ? "border-blue-600 bg-blue-600 text-white"
                              : isActive
                                ? "border-blue-600 bg-white text-blue-600"
                                : "border-gray-300 bg-white text-gray-400"
                          }`}
                        >
                          {isComplete ? (
                            <FaCheck className="text-[10px]" />
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="space-y-6 xl:col-span-2">
                <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Applicant Details
                  </h3>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Role</p>
                      <p className="text-sm text-gray-900">
                        {normalizeLabelValue(row.role)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">
                        Applied from
                      </p>
                      <p className="text-sm text-gray-900">
                        {normalizeLabelValue(row.application_place)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">
                        Experience level
                      </p>
                      <p className="text-sm text-gray-900">
                        {normalizeLabelValue(row.experience_level)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">
                        Employment status
                      </p>
                      <p className="text-sm text-gray-900">
                        {normalizeLabelValue(row.employment_status)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">
                        Current company
                      </p>
                      <p className="text-sm text-gray-900">
                        {normalizeLabelValue(row.current_company)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">
                        Current designation
                      </p>
                      <p className="text-sm text-gray-900">
                        {normalizeLabelValue(row.current_designation)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">
                        Expected CTC
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatCurrency(row.expected_ctc)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">
                        Notice period
                      </p>
                      <p className="text-sm text-gray-900">
                        {normalizeLabelValue(row.notice_period)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">
                        Gender
                      </p>
                      <p className="text-sm text-gray-900">
                        {normalizeLabelValue(row.gender)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">
                        Date of birth
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatDate(row.dob)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">
                        Source
                      </p>
                      <p className="text-sm text-gray-900">
                        {normalizeLabelValue(row.source)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">
                        Application date
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatDate(row.application_date)}
                      </p>
                    </div>
                  </div>
                </section>
                <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Education
                  </h3>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {educationBlocks.map((section) => (
                      <div
                        key={section.label}
                        className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          {section.label}
                        </p>
                        {section.hasValue ? (
                          <div className="mt-2 space-y-1 text-sm text-gray-700">
                            {section.values.map((item) => (
                              <div
                                key={`${section.label}-${item.label}`}
                                className="flex items-center justify-between gap-2"
                              >
                                <span className="text-xs text-gray-500">
                                  {item.label}
                                </span>
                                <span className="font-medium text-gray-900">
                                  {item.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-gray-400">
                            No details provided.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
                <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Skills & Notes
                  </h3>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Skills
                      </p>
                      <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">
                        {normalizeLabelValue(row.skills)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Projects
                      </p>
                      <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">
                        {normalizeLabelValue(row.projects)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Cover letter
                      </p>
                      <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">
                        {normalizeLabelValue(row.cover_letter)}
                      </p>
                    </div>
                  </div>
                </section>
                <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">
                      Hiring Actions
                    </h3>
                    <span className="text-xs text-gray-500">
                      Time zone: {timeZone}
                    </span>
                  </div>
                  <div className="mt-4 space-y-4">
                    <details
                      open={status === "shortlisted"}
                      className="group rounded-xl border border-gray-100 bg-gray-50 p-4"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                          <FaClipboardList className="text-blue-600" />
                          Assignment
                        </div>
                        <FaChevronDown className="text-gray-400 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="mt-4 grid grid-cols-1 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-600">
                            Subject
                          </label>
                          <input
                            value={assignmentSubjectValue}
                            onChange={(e) =>
                              updateDraft(row.id, {
                                assignmentSubject: e.target.value,
                              })
                            }
                            placeholder="Assignment for Frontend Developer"
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label className="text-xs font-semibold text-gray-600">
                              Assignment PDF URL
                            </label>
                            <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                              <FaFilePdf className="text-gray-400" />
                              <input
                                value={assignmentPdfValue}
                                onChange={(e) =>
                                  updateDraft(row.id, {
                                    assignmentPdfUrl: e.target.value,
                                  })
                                }
                                placeholder="https://"
                                className="w-full text-sm text-gray-700 focus:outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600">
                              Due date
                            </label>
                            <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                              <FaCalendarAlt className="text-gray-400" />
                              <input
                                type="date"
                                value={assignmentDueValue}
                                onChange={(e) =>
                                  updateDraft(row.id, {
                                    assignmentDueDate: e.target.value,
                                  })
                                }
                                className="w-full text-sm text-gray-700 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600">
                            Message
                          </label>
                          <textarea
                            rows={4}
                            value={assignmentMessageValue}
                            onChange={(e) =>
                              updateDraft(row.id, {
                                assignmentMessage: e.target.value,
                              })
                            }
                            placeholder="Include expectations, submission format, and deadline."
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAssignmentSend}
                          disabled={actionSending.assignment}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          {actionSending.assignment ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaPaperPlane />
                          )}
                          Send Assignment
                        </button>
                      </div>
                    </details>

                    <details
                      open={status === "interview_scheduled"}
                      className="group rounded-xl border border-gray-100 bg-gray-50 p-4"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                          <FaLink className="text-indigo-600" />
                          Interview
                        </div>
                        <FaChevronDown className="text-gray-400 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="mt-4 grid grid-cols-1 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-600">
                            Subject
                          </label>
                          <input
                            value={interviewSubjectValue}
                            onChange={(e) =>
                              updateDraft(row.id, {
                                interviewSubject: e.target.value,
                              })
                            }
                            placeholder="Interview invitation"
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label className="text-xs font-semibold text-gray-600">
                              Meet link
                            </label>
                            <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                              <FaLink className="text-gray-400" />
                              <input
                                value={interviewMeetValue}
                                onChange={(e) =>
                                  updateDraft(row.id, {
                                    interviewMeetLink: e.target.value,
                                  })
                                }
                                placeholder="https://meet.google.com/..."
                                className="w-full text-sm text-gray-700 focus:outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600">
                              Schedule
                            </label>
                            <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                              <FaCalendarAlt className="text-gray-400" />
                              <input
                                type="datetime-local"
                                value={interviewScheduleValue}
                                onChange={(e) =>
                                  updateDraft(row.id, {
                                    interviewScheduledAt: e.target.value,
                                  })
                                }
                                className="w-full text-sm text-gray-700 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600">
                            Message
                          </label>
                          <textarea
                            rows={4}
                            value={interviewMessageValue}
                            onChange={(e) =>
                              updateDraft(row.id, {
                                interviewMessage: e.target.value,
                              })
                            }
                            placeholder="Share the agenda and interview panel."
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleInterviewSend}
                          disabled={actionSending.interview}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                          {actionSending.interview ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaPaperPlane />
                          )}
                          Send Interview Invite
                        </button>
                      </div>
                    </details>

                    <details
                      open={status === "hr_round"}
                      className="group rounded-xl border border-gray-100 bg-gray-50 p-4"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                          <FaCalendarAlt className="text-fuchsia-600" />
                          HR Round
                        </div>
                        <FaChevronDown className="text-gray-400 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="mt-4 grid grid-cols-1 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-600">
                            Subject
                          </label>
                          <input
                            value={hrSubjectValue}
                            onChange={(e) =>
                              updateDraft(row.id, {
                                hrSubject: e.target.value,
                              })
                            }
                            placeholder="HR discussion"
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600">
                            Schedule
                          </label>
                          <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                            <FaCalendarAlt className="text-gray-400" />
                            <input
                              type="datetime-local"
                              value={hrScheduleValue}
                              onChange={(e) =>
                                updateDraft(row.id, {
                                  hrScheduledAt: e.target.value,
                                })
                              }
                              className="w-full text-sm text-gray-700 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600">
                            Message
                          </label>
                          <textarea
                            rows={4}
                            value={hrMessageValue}
                            onChange={(e) =>
                              updateDraft(row.id, { hrMessage: e.target.value })
                            }
                            placeholder="Share HR agenda and expected documents."
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleHrSend}
                          disabled={actionSending.hr}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white hover:bg-fuchsia-700 disabled:opacity-60"
                        >
                          {actionSending.hr ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaPaperPlane />
                          )}
                          Send HR Invite
                        </button>
                      </div>
                    </details>

                    <details
                      open={status === "offered"}
                      className="group rounded-xl border border-gray-100 bg-gray-50 p-4"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                          <FaFilePdf className="text-violet-600" />
                          Offer
                        </div>
                        <FaChevronDown className="text-gray-400 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="mt-4 grid grid-cols-1 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-600">
                            Subject
                          </label>
                          <input
                            value={offerSubjectValue}
                            onChange={(e) =>
                              updateDraft(row.id, {
                                offerSubject: e.target.value,
                              })
                            }
                            placeholder="Offer letter"
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600">
                            Offer PDF URL
                          </label>
                          <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                            <FaFilePdf className="text-gray-400" />
                            <input
                              value={offerPdfValue}
                              onChange={(e) =>
                                updateDraft(row.id, {
                                  offerPdfUrl: e.target.value,
                                })
                              }
                              placeholder="https://"
                              className="w-full text-sm text-gray-700 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600">
                            Message
                          </label>
                          <textarea
                            rows={4}
                            value={offerMessageValue}
                            onChange={(e) =>
                              updateDraft(row.id, {
                                offerMessage: e.target.value,
                              })
                            }
                            placeholder="Confirm compensation and joining date."
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleOfferSend}
                          disabled={actionSending.offer}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                        >
                          {actionSending.offer ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaPaperPlane />
                          )}
                          Send Offer
                        </button>
                      </div>
                    </details>
                  </div>
                </section>
              </div>
              <aside className="space-y-6">
                <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Timeline
                  </h3>
                  <div className="mt-4 space-y-3 text-sm text-gray-700">
                    {timelineItems.length ? (
                      timelineItems.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-start justify-between gap-2"
                        >
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            {item.label}
                          </span>
                          <span className="text-right">{item.value}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">
                        Timeline data not available.
                      </p>
                    )}
                  </div>
                </section>
                <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Latest Notes
                  </h3>
                  <div className="mt-4 space-y-3">
                    {noteItems.length ? (
                      noteItems.map((item) => (
                        <div
                          key={item.label}
                          className="rounded-lg bg-gray-50 p-3"
                        >
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {item.label}
                          </p>
                          <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                            {item.value}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">
                        No notes captured yet.
                      </p>
                    )}
                  </div>
                </section>
              </aside>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default CareerApplicationDetails;
