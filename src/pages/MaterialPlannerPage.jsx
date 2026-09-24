import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Upload,
  FileText,
  Check,
  Lock,
  ChevronDown,
  ChevronUp,
  Clock3,
  BookOpen,
  Layers3,
  BarChart3,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Trash2,
  ArrowLeft,
  FolderOpen,
  Plus,
} from "lucide-react";

import { extractMaterial } from "../utils/materialExtractor";
import { supabase } from "../supabaseClient";

/* ======================================================
   LOCAL STORAGE
   Only used for remembering which material is open.
   Actual materials/progress are stored in Supabase.
====================================================== */

const ACTIVE_MATERIAL_KEY =
  "maarga-active-material";

const MAX_MATERIALS = 5;

/* ======================================================
   HELPERS
====================================================== */

function countWords(text = "") {
  return String(text)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length;
}

function cleanText(text = "") {
  return String(text)
    .replace(/\s+/g, " ")
    .trim();
}

function createId() {
  if (
    typeof crypto !== "undefined" &&
    crypto.randomUUID
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function createDayTitle(units) {
  if (!units?.length) {
    return "Learning Day";
  }

  const firstUnit = units[0];

  const meaningful =
    firstUnit.cells
      ?.map((cell) =>
        cleanText(cell.value)
      )
      .filter(Boolean) || [];

  if (meaningful.length) {
    const title = meaningful[0];

    if (title.length <= 80) {
      return title;
    }

    return `${title.slice(0, 77)}...`;
  }

  if (firstUnit.text) {
    const title = cleanText(firstUnit.text);

    return title.length <= 80
      ? title
      : `${title.slice(0, 77)}...`;
  }

  return "Learning Day";
}

/* ======================================================
   ACTUAL SOURCE UNITS → TASKS
====================================================== */

function unitsToTasks(units) {
  return units.flatMap((unit) => {
    if (
      unit.cells &&
      unit.cells.length
    ) {
      return unit.cells
        .filter(
          (cell) =>
            cleanText(cell.value)
        )
        .map((cell) => ({
          id: `${unit.id}-${cell.label}`,
          label: cell.label,
          text: cleanText(cell.value),
          sourceUnit: unit.id,
        }));
    }

    if (unit.text) {
      return [
        {
          id: unit.id,
          label: "Content",
          text: cleanText(unit.text),
          sourceUnit: unit.id,
        },
      ];
    }

    return [];
  });
}

/* ======================================================
   DISTRIBUTE SOURCE CONTENT
====================================================== */

function distributeUnits(
  units,
  numberOfDays
) {
  if (!units.length) {
    return Array.from(
      {
        length: numberOfDays,
      },
      (_, index) => ({
        dayNumber: index + 1,
        units: [],
      })
    );
  }

  /* Exact match:
     30 source rows → 30 days
  */

  if (
    units.length ===
    numberOfDays
  ) {
    return units.map(
      (unit, index) => ({
        dayNumber: index + 1,
        units: [unit],
      })
    );
  }

  /* More source units than days */

  if (
    units.length >
    numberOfDays
  ) {
    const totalWeight =
      units.reduce(
        (sum, unit) =>
          sum +
          Math.max(
            1,
            unit.weight || 1
          ),
        0
      );

    const targetWeight =
      totalWeight /
      numberOfDays;

    const days =
      Array.from(
        {
          length: numberOfDays,
        },
        (_, index) => ({
          dayNumber: index + 1,
          units: [],
          weight: 0,
        })
      );

    let currentDay = 0;

    for (
      let i = 0;
      i < units.length;
      i++
    ) {
      const unit = units[i];

      const unitWeight =
        Math.max(
          1,
          unit.weight || 1
        );

      const remainingUnits =
        units.length - i;

      const remainingDays =
        numberOfDays -
        currentDay;

      const shouldMove =
        currentDay <
          numberOfDays - 1 &&
        days[currentDay]
          .units.length > 0 &&
        days[currentDay]
          .weight +
          unitWeight >
          targetWeight &&
        remainingUnits >=
          remainingDays;

      if (shouldMove) {
        currentDay++;
      }

      days[currentDay].units.push(
        unit
      );

      days[currentDay].weight +=
        unitWeight;
    }

    return days;
  }

  /* More days than source units */

  return [
    ...units.map(
      (unit, index) => ({
        dayNumber: index + 1,
        units: [unit],
      })
    ),

    ...Array.from(
      {
        length:
          numberOfDays -
          units.length,
      },
      (_, index) => ({
        dayNumber:
          units.length +
          index +
          1,
        units: [],
      })
    ),
  ];
}

/* ======================================================
   SUPABASE MATERIAL STORAGE
====================================================== */

async function getCurrentUser() {
  const {
    data,
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!data?.user) {
    throw new Error(
      "You must be logged in to use the Material Planner."
    );
  }

  return data.user;
}

/* ======================================================
   DATABASE ROW → FRONTEND MATERIAL
====================================================== */

function dbRowToMaterial(row) {
  const settings =
    row.settings || {};

  const progress =
    row.progress || {};

  return {
    id: row.id,

    name: row.name,

    type: row.type,

    material: {
      type: row.type,
      name: row.name,

      pageCount:
        row.page_count || 1,

      wordCount:
        row.word_count || 0,

      hasTables:
        Boolean(row.has_tables),

      units:
        Array.isArray(row.units)
          ? row.units
          : [],
    },

    learningDays:
      Number(
        settings.learningDays
      ) || 30,

    hoursPerDay:
      Number(
        settings.hoursPerDay
      ) || 0.5,

    completedDays:
      Array.isArray(
        progress.completedDays
      )
        ? progress.completedDays
        : [],

    selectedDay:
      Number(
        progress.selectedDay
      ) || 1,

    expandedDays:
      Array.isArray(
        progress.expandedDays
      )
        ? progress.expandedDays
        : [1],

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}

/* ======================================================
   FRONTEND MATERIAL → DATABASE ROW
====================================================== */

function materialToDbRow(
  material,
  userId
) {
  return {
    id: material.id,

    user_id: userId,

    name:
      material.name,

    type:
      material.type,

    page_count:
      material.material?.pageCount ||
      1,

    word_count:
      material.material?.wordCount ||
      0,

    has_tables:
      Boolean(
        material.material?.hasTables
      ),

    units:
      material.material?.units ||
      [],

    settings: {
      learningDays:
        material.learningDays ||
        30,

      hoursPerDay:
        material.hoursPerDay ||
        0.5,
    },

    progress: {
      completedDays:
        material.completedDays ||
        [],

      selectedDay:
        material.selectedDay ||
        1,

      expandedDays:
        material.expandedDays ||
        [1],
    },

    updated_at:
      new Date().toISOString(),
  };
}

/* ======================================================
   MAIN COMPONENT
====================================================== */

export default function MaterialPlannerPage() {
  const [
    materials,
    setMaterials,
  ] = useState([]);

  const [
    activeMaterialId,
    setActiveMaterialId,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState(null);

  /* ====================================================
     LOAD MATERIALS FROM SUPABASE
  ==================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadMaterials() {
      try {
        setLoading(true);
        setError("");

        const user =
          await getCurrentUser();

        const {
          data,
          error: fetchError,
        } = await supabase
          .from("learning_materials")
          .select("*")
          .eq(
            "user_id",
            user.id
          )
          .order(
            "created_at",
            {
              ascending: true,
            }
          );

        if (fetchError) {
          throw fetchError;
        }

        if (!mounted) {
          return;
        }

        const loadedMaterials =
          (data || []).map(
            dbRowToMaterial
          );

        setMaterials(
          loadedMaterials
        );

        const savedActiveId =
          localStorage.getItem(
            ACTIVE_MATERIAL_KEY
          );

        if (
          savedActiveId &&
          loadedMaterials.some(
            (item) =>
              item.id ===
              savedActiveId
          )
        ) {
          setActiveMaterialId(
            savedActiveId
          );
        }
      } catch (err) {
        console.error(
          "Could not load materials:",
          err
        );

        if (mounted) {
          setError(
            err?.message ||
              "Could not load your learning materials."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadMaterials();

    return () => {
      mounted = false;
    };
  }, []);

  /* ====================================================
     SAVE ACTIVE MATERIAL ID
  ==================================================== */

  useEffect(() => {
    if (activeMaterialId) {
      localStorage.setItem(
        ACTIVE_MATERIAL_KEY,
        activeMaterialId
      );
    } else {
      localStorage.removeItem(
        ACTIVE_MATERIAL_KEY
      );
    }
  }, [
    activeMaterialId,
  ]);

  /* ====================================================
     ACTIVE MATERIAL
  ==================================================== */

  const activeMaterial =
    materials.find(
      (item) =>
        item.id ===
        activeMaterialId
    ) || null;

  /* ====================================================
     UPLOAD MATERIAL
  ==================================================== */

  async function handleFile(
    file
  ) {
    if (!file) {
      return;
    }

    setError("");

    if (
      materials.length >=
      MAX_MATERIALS
    ) {
      setError(
        "You can upload a maximum of 5 materials. Delete a material to upload another."
      );

      return;
    }

    setLoading(true);

    try {
      const user =
        await getCurrentUser();

      const extracted =
        await extractMaterial(file);

      if (
        !extracted.units ||
        !extracted.units.length
      ) {
        throw new Error(
          "No usable learning content was found in this file."
        );
      }

      const now =
        new Date().toISOString();

      const newMaterial = {
        id: createId(),

        name:
          file.name,

        type:
          extracted.type ||
          file.name
            .split(".")
            .pop()
            ?.toLowerCase(),

        material:
          extracted,

        learningDays:
          30,

        hoursPerDay:
          0.5,

        completedDays:
          [],

        selectedDay:
          1,

        expandedDays:
          [1],

        createdAt:
          now,

        updatedAt:
          now,
      };

      const dbRow =
        materialToDbRow(
          newMaterial,
          user.id
        );

      const {
        data,
        error: insertError,
      } = await supabase
        .from(
          "learning_materials"
        )
        .insert(dbRow)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      const savedMaterial =
        dbRowToMaterial(data);

      setMaterials(
        (previous) => [
          ...previous,
          savedMaterial,
        ]
      );

      setActiveMaterialId(
        savedMaterial.id
      );
    } catch (err) {
      console.error(
        "Material upload failed:",
        err
      );

      setError(
        err?.message ||
          "Unable to save this material."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(
    event
  ) {
    const file =
      event.target.files?.[0];

    if (file) {
      handleFile(file);
    }

    event.target.value = "";
  }

  /* ====================================================
     UPDATE ACTIVE MATERIAL
     Saves settings/progress to Supabase.
  ==================================================== */

  async function updateActiveMaterial(
    updates
  ) {
    if (!activeMaterialId) {
      return;
    }

    const currentMaterial =
      materials.find(
        (item) =>
          item.id ===
          activeMaterialId
      );

    if (!currentMaterial) {
      return;
    }

    const updatedMaterial = {
      ...currentMaterial,
      ...updates,
      updatedAt:
        new Date().toISOString(),
    };

    /* Update UI immediately */

    setMaterials(
      (previous) =>
        previous.map(
          (item) =>
            item.id ===
            activeMaterialId
              ? updatedMaterial
              : item
        )
    );

    try {
      const user =
        await getCurrentUser();

      const dbRow =
        materialToDbRow(
          updatedMaterial,
          user.id
        );

      /* id and user_id should not
         be changed during update */

      delete dbRow.user_id;
      delete dbRow.id;

      const {
        error: updateError,
      } = await supabase
        .from(
          "learning_materials"
        )
        .update(dbRow)
        .eq(
          "id",
          activeMaterialId
        )
        .eq(
          "user_id",
          user.id
        );

      if (updateError) {
        throw updateError;
      }
    } catch (err) {
      console.error(
        "Could not save material progress:",
        err
      );

      setError(
        "Your change could not be saved to the server."
      );
    }
  }

  /* ====================================================
     OPEN MATERIAL
  ==================================================== */

  function openMaterial(
    materialId
  ) {
    setError("");

    setActiveMaterialId(
      materialId
    );
  }

  /* ====================================================
     BACK TO MATERIAL LIBRARY
  ==================================================== */

  function backToLibrary() {
    setActiveMaterialId(
      null
    );

    localStorage.removeItem(
      ACTIVE_MATERIAL_KEY
    );

    setError("");

    setDeleteTarget(null);
  }

  /* ====================================================
     DELETE REQUEST
  ==================================================== */

  function requestDelete(
    material
  ) {
    setDeleteTarget(
      material
    );
  }

  /* ====================================================
     DELETE MATERIAL FROM SUPABASE
  ==================================================== */

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    const idToDelete =
      deleteTarget.id;

    try {
      const user =
        await getCurrentUser();

      const {
        error: deleteError,
      } = await supabase
        .from(
          "learning_materials"
        )
        .delete()
        .eq(
          "id",
          idToDelete
        )
        .eq(
          "user_id",
          user.id
        );

      if (deleteError) {
        throw deleteError;
      }

      const updated =
        materials.filter(
          (item) =>
            item.id !==
            idToDelete
        );

      setMaterials(
        updated
      );

      if (
        activeMaterialId ===
        idToDelete
      ) {
        setActiveMaterialId(
          null
        );

        localStorage.removeItem(
          ACTIVE_MATERIAL_KEY
        );
      }

      setDeleteTarget(
        null
      );

      setError("");
    } catch (err) {
      console.error(
        "Could not delete material:",
        err
      );

      setError(
        err?.message ||
          "Could not delete this material."
      );
    }
  }

  /* ====================================================
     LIBRARY VIEW
  ==================================================== */

  if (!activeMaterial) {
    return (
      <>
        <MaterialLibrary
          materials={materials}
          loading={loading}
          error={error}
          onUpload={handleInputChange}
          onOpen={openMaterial}
          onDelete={requestDelete}
        />

        {deleteTarget && (
          <DeleteModal
            material={
              deleteTarget
            }
            onCancel={() =>
              setDeleteTarget(
                null
              )
            }
            onConfirm={
              confirmDelete
            }
          />
        )}
      </>
    );
  }

  /* ====================================================
     PLANNER VIEW
  ==================================================== */

  return (
    <MaterialPlanner
      materialRecord={
        activeMaterial
      }
      updateMaterial={
        updateActiveMaterial
      }
      onBack={
        backToLibrary
      }
      onDelete={() =>
        requestDelete(
          activeMaterial
        )
      }
      deleteTarget={
        deleteTarget
      }
      onCancelDelete={() =>
        setDeleteTarget(
          null
        )
      }
      onConfirmDelete={
        confirmDelete
      }
    />
  );
}

/* ======================================================
   MATERIAL LIBRARY
====================================================== */

function MaterialLibrary({
  materials,
  loading,
  error,
  onUpload,
  onOpen,
  onDelete,
}) {
  return (
    <div className="min-h-screen bg-[#07070c] text-white">
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">

        {/* HEADER */}

        <div className="mb-10">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles
              size={18}
              className="text-violet-400"
            />

            <span className="text-sm font-semibold tracking-[0.25em] text-violet-300">
              MAARGA
            </span>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                Material Library
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                Keep your learning materials organized
                and continue every learning path exactly
                where you left off.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-3">
              <p className="text-xs uppercase tracking-[0.15em] text-zinc-600">
                Materials
              </p>

              <p className="mt-1 text-lg font-bold">
                {materials.length}

                <span className="text-zinc-600">
                  {" "}
                  / {MAX_MATERIALS}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* MATERIALS */}

        {materials.length > 0 && (
          <section className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <FolderOpen
                size={18}
                className="text-violet-300"
              />

              <h2 className="text-lg font-semibold">
                Your materials
              </h2>
            </div>

            <div className="grid gap-3">
              {materials.map(
                (item) => {
                  const completed =
                    item.completedDays
                      ?.length || 0;

                  const units =
                    item.material
                      ?.units
                      ?.length || 0;

                  const days =
                    item.learningDays ||
                    30;

                  const progress =
                    days > 0
                      ? Math.round(
                          (completed /
                            days) *
                            100
                        )
                      : 0;

                  return (
                    <MaterialCard
                      key={
                        item.id
                      }
                      material={
                        item
                      }
                      units={
                        units
                      }
                      progress={
                        progress
                      }
                      onOpen={() =>
                        onOpen(
                          item.id
                        )
                      }
                      onDelete={() =>
                        onDelete(
                          item
                        )
                      }
                    />
                  );
                }
              )}
            </div>
          </section>
        )}

        {/* UPLOAD */}

        {materials.length <
        MAX_MATERIALS ? (
          <label className="group block cursor-pointer">
            <input
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={
                onUpload
              }
              className="hidden"
              disabled={
                loading
              }
            />

            <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.025] p-10 text-center transition group-hover:border-violet-400/50 group-hover:bg-violet-500/[0.04]">

              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
                {loading ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-300 border-t-transparent" />
                ) : (
                  <Plus
                    size={28}
                  />
                )}
              </div>

              <h2 className="text-xl font-semibold">
                {loading
                  ? "Reading your material..."
                  : "Add new material"}
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                Upload another PDF or document.
                Your existing learning paths will
                remain untouched.
              </p>

              <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold transition group-hover:bg-violet-500">
                <Upload
                  size={17}
                />
                Upload material
              </div>

              <p className="mt-4 text-xs text-zinc-600">
                {MAX_MATERIALS -
                  materials.length}{" "}
                slot
                {MAX_MATERIALS -
                  materials.length ===
                1
                  ? ""
                  : "s"}{" "}
                remaining
              </p>
            </div>
          </label>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-zinc-500">
              <FolderOpen
                size={22}
              />
            </div>

            <h2 className="font-semibold">
              Material limit reached
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
              You can keep up to 5 learning
              materials. Delete an existing
              material to upload another.
            </p>
          </div>
        )}

        {/* EMPTY */}

        {materials.length ===
          0 && (
          <div className="mt-8 text-center">
            <p className="text-xs text-zinc-600">
              Your materials and learning
              progress are securely saved
              to your account.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ======================================================
   MATERIAL CARD
====================================================== */

function MaterialCard({
  material,
  units,
  progress,
  onOpen,
  onDelete,
}) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-violet-400/20 hover:bg-white/[0.04]">

      <div className="flex items-center gap-4">

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
          <FileText
            size={22}
          />
        </div>

        <button
          type="button"
          onClick={
            onOpen
          }
          className="min-w-0 flex-1 text-left"
        >
          <h3 className="truncate font-semibold text-white transition group-hover:text-violet-200">
            {material.name}
          </h3>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600">
            <span>
              {material.type?.toUpperCase()}
            </span>

            <span>
              {units} content unit
              {units === 1
                ? ""
                : "s"}
            </span>

            <span>
              {material.learningDays ||
                30}{" "}
              days
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <span className="text-xs font-medium text-zinc-500">
              {progress}%
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={
            onOpen
          }
          className="hidden shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold transition hover:bg-violet-500 sm:flex"
        >
          Open

          <ArrowRight
            size={16}
          />
        </button>

        <button
          type="button"
          onClick={
            onDelete
          }
          title="Delete material"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-zinc-500 transition hover:border-red-400/20 hover:bg-red-400/5 hover:text-red-300"
        >
          <Trash2
            size={17}
          />
        </button>
      </div>
    </div>
  );
}

/* ======================================================
   PLANNER
====================================================== */

function MaterialPlanner({
  materialRecord,
  updateMaterial,
  onBack,
  onDelete,
  deleteTarget,
  onCancelDelete,
  onConfirmDelete,
}) {
  const material =
    materialRecord.material;

  const fileName =
    materialRecord.name;

  const learningDays =
    materialRecord.learningDays ||
    30;

  const hoursPerDay =
    materialRecord.hoursPerDay ||
    0.5;

  const completedDays =
    materialRecord.completedDays ||
    [];

  const expandedDays =
    materialRecord.expandedDays ||
    [1];

  const selectedDay =
    materialRecord.selectedDay ||
    1;

  /* ====================================================
     PLAN
  ==================================================== */

  const plan =
    useMemo(() => {
      if (
        !material?.units?.length
      ) {
        return [];
      }

      const distributed =
        distributeUnits(
          material.units,
          learningDays
        );

      return distributed.map(
        (day) => {
          const tasks =
            unitsToTasks(
              day.units
            );

          const words =
            day.units.reduce(
              (sum, unit) =>
                sum +
                (unit.words ||
                  countWords(
                    unit.text
                  )),
              0
            );

          return {
            ...day,

            title:
              createDayTitle(
                day.units
              ),

            tasks,

            words,

            weight:
              day.units.reduce(
                (sum, unit) =>
                  sum +
                  Math.max(
                    1,
                    unit.weight ||
                      1
                  ),
                0
              ),
          };
        }
      );
    }, [
      material,
      learningDays,
    ]);

  /* ====================================================
     SETTINGS
  ==================================================== */

  function changeLearningDays(
    days
  ) {
    updateMaterial({
      learningDays:
        days,

      completedDays:
        [],

      selectedDay:
        1,

      expandedDays:
        [1],
    });
  }

  function changeHours(
    hours
  ) {
    updateMaterial({
      hoursPerDay:
        hours,
    });
  }

  /* ====================================================
     COMPLETION
  ==================================================== */

  function isDayCompleted(
    dayNumber
  ) {
    return completedDays.includes(
      dayNumber
    );
  }

  function isDayUnlocked(
    dayNumber
  ) {
    if (
      dayNumber === 1
    ) {
      return true;
    }

    return completedDays.includes(
      dayNumber - 1
    );
  }

  function completeDay(
    dayNumber
  ) {
    if (
      !isDayUnlocked(
        dayNumber
      )
    ) {
      return;
    }

    if (
      isDayCompleted(
        dayNumber
      )
    ) {
      return;
    }

    const next =
      Math.min(
        dayNumber + 1,
        plan.length
      );

    const updatedCompleted = [
      ...completedDays,
      dayNumber,
    ];

    updateMaterial({
      completedDays:
        updatedCompleted,

      selectedDay:
        next,

      expandedDays:
        [next],
    });
  }

  /* ====================================================
     RESET
  ==================================================== */

  function resetProgress() {
    updateMaterial({
      completedDays:
        [],

      selectedDay:
        1,

      expandedDays:
        [1],
    });
  }

  /* ====================================================
     TOGGLE
  ==================================================== */

  function toggleDay(
    dayNumber
  ) {
    if (
      !isDayUnlocked(
        dayNumber
      )
    ) {
      return;
    }

    const updatedExpanded =
      expandedDays.includes(
        dayNumber
      )
        ? expandedDays.filter(
            (day) =>
              day !==
              dayNumber
          )
        : [
            ...expandedDays,
            dayNumber,
          ];

    updateMaterial({
      expandedDays:
        updatedExpanded,

      selectedDay:
        dayNumber,
    });
  }

  /* ====================================================
     STATS
  ==================================================== */

  const totalWords =
    material?.wordCount ||
    0;

  const totalWeight =
    material?.units?.reduce(
      (sum, unit) =>
        sum +
        Math.max(
          1,
          unit.weight || 1
        ),
      0
    ) || 0;

  const completedCount =
    completedDays.length;

  const progress =
    plan.length
      ? Math.round(
          (completedCount /
            plan.length) *
            100
        )
      : 0;

  /* ====================================================
     UI
  ==================================================== */

  return (
    <div className="min-h-screen bg-[#07070c] text-white">

      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">

        {/* TOP NAVIGATION */}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <button
            type="button"
            onClick={
              onBack
            }
            className="group flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-violet-400/30 hover:bg-violet-500/10 hover:text-white"
          >
            <ArrowLeft
              size={17}
              className="transition-transform group-hover:-translate-x-1"
            />

            Back to Materials
          </button>

          <button
            type="button"
            onClick={
              onDelete
            }
            className="flex w-fit items-center gap-2 rounded-xl border border-red-400/10 bg-red-400/[0.03] px-4 py-2.5 text-sm text-red-300 transition hover:bg-red-400/[0.08]"
          >
            <Trash2
              size={16}
            />

            Delete material
          </button>
        </div>

        {/* HEADER */}

        <div className="mb-8">

          <div className="mb-2 flex items-center gap-2">
            <Sparkles
              size={18}
              className="text-violet-400"
            />

            <span className="text-sm font-semibold tracking-[0.25em] text-violet-300">
              MAARGA
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Material Planner
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Continue your learning path exactly
            where you left off.
          </p>
        </div>

        {/* FILE CARD */}

        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.035] p-5">

          <div className="flex items-start gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
              <FileText
                size={22}
              />
            </div>

            <div className="min-w-0 flex-1">

              <h2 className="truncate font-semibold">
                {fileName}
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                {material.type?.toUpperCase()}

                {" · "}

                {material.pageCount ||
                  1}{" "}
                page
                {material.pageCount ===
                1
                  ? ""
                  : "s"}

                {" · "}

                {material.units?.length ||
                  0}{" "}
                content units
              </p>

            </div>
          </div>
        </div>

        {/* STATS */}

        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">

          <StatCard
            icon={
              <Layers3
                size={19}
              />
            }
            label="Actual content units"
            value={
              material.units.length
            }
          />

          <StatCard
            icon={
              <FileText
                size={19}
              />
            }
            label="Words"
            value={
              totalWords.toLocaleString()
            }
          />

          <StatCard
            icon={
              <BarChart3
                size={19}
              />
            }
            label="Total material weight"
            value={
              totalWeight.toFixed(
                1
              )
            }
          />
        </div>

        {/* PLAN SETTINGS */}

        <section className="mb-8 rounded-3xl border border-white/10 bg-white/[0.025] p-6">

          <div className="mb-6">

            <h2 className="text-lg font-semibold">
              Plan settings
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Your settings are saved separately
              for this material.
            </p>
          </div>

          {/* DAYS */}

          <div className="mb-6">

            <div className="mb-3 flex items-center justify-between">

              <label className="text-sm font-medium text-zinc-300">
                Learning days
              </label>

              <span className="text-sm font-semibold text-violet-300">
                {learningDays} days
              </span>
            </div>

            <div className="flex flex-wrap gap-2">

              {[7, 14, 21, 30, 45, 60, 90].map(
                (days) => (
                  <button
                    key={
                      days
                    }
                    type="button"
                    onClick={() =>
                      changeLearningDays(
                        days
                      )
                    }
                    className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                      learningDays ===
                      days
                        ? "bg-violet-600 text-white"
                        : "border border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.07] hover:text-white"
                    }`}
                  >
                    {days} days
                  </button>
                )
              )}

            </div>
          </div>

          {/* HOURS */}

          <div>

            <div className="mb-3 flex items-center justify-between">

              <label className="text-sm font-medium text-zinc-300">
                Hours per day
              </label>

              <span className="text-sm font-semibold text-violet-300">
                {hoursPerDay ===
                0.5
                  ? "30 min"
                  : `${hoursPerDay} hr`}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">

              {[0.5, 1, 1.5, 2, 3, 4, 5, 6].map(
                (hours) => (
                  <button
                    key={
                      hours
                    }
                    type="button"
                    onClick={() =>
                      changeHours(
                        hours
                      )
                    }
                    className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                      hoursPerDay ===
                      hours
                        ? "bg-violet-600 text-white"
                        : "border border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.07] hover:text-white"
                    }`}
                  >
                    {hours ===
                    0.5
                      ? "30 min"
                      : `${hours} hr`}
                  </button>
                )
              )}

            </div>
          </div>
        </section>

        {/* PROGRESS */}

        <section className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-br from-violet-500/[0.08] to-blue-500/[0.04] p-6">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
                Journey progress
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                {completedCount} of{" "}
                {plan.length}{" "}
                days completed
              </h2>

            </div>

            <div className="text-left md:text-right">

              <div className="text-3xl font-bold">
                {progress}%
              </div>

              <p className="text-xs text-zinc-500">
                Keep moving forward
              </p>
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">

            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-500"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>
        </section>

        {/* YOUR PATH */}

        <section>

          <div className="mb-5 flex items-end justify-between">

            <div>

              <div className="mb-2 flex items-center gap-2 text-violet-300">

                <BookOpen
                  size={17}
                />

                <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                  Your path
                </span>

              </div>

              <h2 className="text-2xl font-bold">
                {learningDays}-Day Learning Plan
              </h2>

            </div>

            <div className="hidden items-center gap-2 text-sm text-zinc-500 sm:flex">

              <Clock3
                size={16}
              />

              {hoursPerDay ===
              0.5
                ? "30 min"
                : `${hoursPerDay} hr`}

              {" / day"}

            </div>
          </div>

          {/* DAY CARDS */}

          <div className="space-y-3">

            {plan.map(
              (day) => {
                const completed =
                  isDayCompleted(
                    day.dayNumber
                  );

                const unlocked =
                  isDayUnlocked(
                    day.dayNumber
                  );

                const expanded =
                  expandedDays.includes(
                    day.dayNumber
                  );

                return (
                  <DayCard
                    key={
                      day.dayNumber
                    }
                    day={
                      day
                    }
                    completed={
                      completed
                    }
                    unlocked={
                      unlocked
                    }
                    expanded={
                      expanded
                    }
                    selected={
                      selectedDay ===
                      day.dayNumber
                    }
                    onToggle={() =>
                      toggleDay(
                        day.dayNumber
                      )
                    }
                    onComplete={() =>
                      completeDay(
                        day.dayNumber
                      )
                    }
                  />
                );
              }
            )}

          </div>
        </section>

        {/* COMPLETION */}

        {plan.length > 0 &&
          completedCount ===
            plan.length && (
            <div className="mt-8 rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-8 text-center">

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">

                <Check
                  size={26}
                />

              </div>

              <h2 className="text-2xl font-bold">
                Material completed
              </h2>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-400">
                You completed every learning day
                created from this material.
              </p>

            </div>
          )}

        {/* FOOTER */}

        <div className="mt-10 flex flex-col items-center gap-4 border-t border-white/5 pt-8 text-center">

          <p className="text-sm text-zinc-500">
            Your path comes from your material.
          </p>

          <button
            type="button"
            onClick={
              resetProgress
            }
            className="flex items-center gap-2 text-xs text-zinc-600 transition hover:text-zinc-300"
          >

            <RotateCcw
              size={14}
            />

            Reset this material's progress

          </button>

        </div>

      </div>

      {/* DELETE MODAL */}

      {deleteTarget && (
        <DeleteModal
          material={
            deleteTarget
          }
          onCancel={
            onCancelDelete
          }
          onConfirm={
            onConfirmDelete
          }
        />
      )}

    </div>
  );
}

/* ======================================================
   STAT CARD
====================================================== */

function StatCard({
  icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-300">
        {icon}
      </div>

      <p className="text-xs uppercase tracking-[0.15em] text-zinc-600">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold">
        {value}
      </p>

    </div>
  );
}

/* ======================================================
   DAY CARD
====================================================== */

function DayCard({
  day,
  completed,
  unlocked,
  expanded,
  selected,
  onToggle,
  onComplete,
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border transition ${
        completed
          ? "border-emerald-400/20 bg-emerald-400/[0.035]"
          : unlocked
          ? selected
            ? "border-violet-400/30 bg-violet-400/[0.035]"
            : "border-white/10 bg-white/[0.025]"
          : "border-white/5 bg-white/[0.015] opacity-60"
      }`}
    >

      {/* HEADER */}

      <button
        type="button"
        onClick={
          onToggle
        }
        disabled={
          !unlocked
        }
        className={`flex w-full items-center gap-4 p-5 text-left ${
          unlocked
            ? "cursor-pointer"
            : "cursor-not-allowed"
        }`}
      >

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
            completed
              ? "bg-emerald-400/10 text-emerald-300"
              : unlocked
              ? "bg-violet-500/10 text-violet-300"
              : "bg-white/5 text-zinc-600"
          }`}
        >

          {completed ? (
            <Check
              size={19}
            />
          ) : unlocked ? (
            day.dayNumber
          ) : (
            <Lock
              size={17}
            />
          )}

        </div>

        <div className="min-w-0 flex-1">

          <div className="flex flex-wrap items-center gap-2">

            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-600">
              Day{" "}
              {day.dayNumber}
            </span>

            {completed && (
              <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                Completed
              </span>
            )}

            {!unlocked && (
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                Locked
              </span>
            )}

          </div>

          <h3
            className={`mt-1 truncate text-base font-semibold ${
              unlocked
                ? "text-white"
                : "text-zinc-600"
            }`}
          >
            {day.units.length
              ? day.title
              : "No more source content"}
          </h3>

        </div>

        <div className="flex shrink-0 items-center gap-3">

          <span className="hidden text-xs text-zinc-600 sm:block">
            {day.words} words
          </span>

          {unlocked &&
            (expanded ? (
              <ChevronUp
                size={18}
                className="text-zinc-500"
              />
            ) : (
              <ChevronDown
                size={18}
                className="text-zinc-500"
              />
            ))}

        </div>

      </button>

      {/* CONTENT */}

      {expanded &&
        unlocked && (
          <div className="border-t border-white/5 px-5 pb-5">

            {day.units.length ===
            0 ? (
              <div className="py-6 text-sm text-zinc-600">
                All extracted material has already
                been distributed across the earlier
                learning days.
              </div>
            ) : (
              <>
                <div className="pt-5">

                  <div className="mb-3 flex items-center gap-2">

                    <BookOpen
                      size={15}
                      className="text-violet-300"
                    />

                    <span className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                      Tasks
                    </span>

                  </div>

                  <div className="space-y-2">

                    {day.tasks.map(
                      (task) => (
                        <div
                          key={
                            task.id
                          }
                          className="rounded-xl border border-white/5 bg-black/20 px-4 py-3"
                        >

                          <p className="text-sm leading-6 text-zinc-200">
                            {task.text}
                          </p>

                          {task.label &&
                            task.label !==
                              "Content" && (
                              <p className="mt-1 text-[11px] uppercase tracking-wider text-zinc-600">
                                {
                                  task.label
                                }
                              </p>
                            )}

                        </div>
                      )
                    )}

                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-white/[0.025] px-4 py-3">

                  <div className="flex items-center justify-between gap-3">

                    <div>

                      <p className="text-xs font-medium text-zinc-500">
                        Source content
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">

                        {day.units.length}{" "}
                        actual material unit
                        {day.units.length ===
                        1
                          ? ""
                          : "s"}

                        {" · "}

                        {day.words}{" "}
                        words

                      </p>

                    </div>

                    <span className="text-xs font-medium text-violet-300">

                      {day.weight.toFixed(
                        1
                      )}{" "}
                      weight

                    </span>

                  </div>

                </div>

                {!completed ? (
                  <button
                    type="button"
                    onClick={
                      onComplete
                    }
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
                  >

                    <Check
                      size={17}
                    />

                    Complete Day{" "}
                    {
                      day.dayNumber
                    }

                    <ArrowRight
                      size={17}
                    />

                  </button>
                ) : (
                  <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/5 px-5 py-3 text-sm font-medium text-emerald-300">

                    <Check
                      size={17}
                    />

                    Day completed

                  </div>
                )}
              </>
            )}

          </div>
        )}
    </div>
  );
}

/* ======================================================
   DELETE MODAL
====================================================== */

function DeleteModal({
  material,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm">

      <div
        className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111116] p-6 shadow-2xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >

        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-300">

          <Trash2
            size={21}
          />

        </div>

        <h2 className="text-xl font-bold">
          Delete material?
        </h2>

        <p className="mt-2 text-sm leading-6 text-zinc-400">
          This will permanently remove:
        </p>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">

          <p className="truncate text-sm font-medium text-white">
            {material.name}
          </p>

        </div>

        <p className="mt-4 text-xs leading-5 text-zinc-600">
          Its extracted content, learning plan,
          and progress will also be permanently
          removed.
        </p>

        <div className="mt-6 flex gap-3">

          <button
            type="button"
            onClick={
              onCancel
            }
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.07]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={
              onConfirm
            }
            className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            Delete
          </button>

        </div>

      </div>
    </div>
  );
}