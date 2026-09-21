"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

type CellKey = "plant" | "animal" | "prokaryote";
type ProcessKey = "protein" | "atp" | "water";

type Organelle = {
  id: string;
  name: string;
  colour: string;
  kicker: string;
  structure: string;
  function: string;
  markingPoints: string[];
  trap: string;
  seenIn: string;
};

type CellModel = {
  key: CellKey;
  name: string;
  subtitle: string;
  accent: string;
  description: string;
  organelles: Organelle[];
};

const CELL_MODELS: Record<CellKey, CellModel> = {
  plant: {
    key: "plant",
    name: "Plant cell",
    subtitle: "Eukaryotic · autotrophic",
    accent: "#8ee35f",
    description: "A cutaway model for linking specialised structures to transport, photosynthesis and support.",
    organelles: [
      {
        id: "cell-wall",
        name: "Cell wall",
        colour: "#86d350",
        kicker: "Rigid outer boundary",
        structure: "A freely permeable layer containing cellulose microfibrils embedded in a matrix.",
        function: "Maintains shape, resists excessive water entry and prevents osmotic bursting.",
        markingPoints: ["cellulose microfibrils", "freely permeable", "resists turgor pressure"],
        trap: "The cell wall does not control selective entry; the plasma membrane does.",
        seenIn: "Plant cells; absent from animal cells.",
      },
      {
        id: "cell-membrane",
        name: "Plasma membrane",
        colour: "#40d9b2",
        kicker: "Selective boundary",
        structure: "A phospholipid bilayer containing proteins, cholesterol and surface carbohydrates.",
        function: "Controls movement of substances and enables recognition, adhesion and signalling.",
        markingPoints: ["phospholipid bilayer", "selectively permeable", "transport proteins"],
        trap: "Do not describe it as a fixed sandwich; the syllabus model is fluid mosaic.",
        seenIn: "Every living cell.",
      },
      {
        id: "nucleus",
        name: "Nucleus",
        colour: "#a883ff",
        kicker: "Genetic control centre",
        structure: "A double-membrane envelope with pores surrounds chromatin and a nucleolus.",
        function: "Stores hereditary information and controls gene expression and cell activity.",
        markingPoints: ["double membrane", "nuclear pores", "chromatin", "nucleolus"],
        trap: "A mature mammalian red blood cell is a classic exception: it lacks a nucleus.",
        seenIn: "Eukaryotic cells.",
      },
      {
        id: "chloroplast",
        name: "Chloroplast",
        colour: "#4adf77",
        kicker: "Photosynthetic organelle",
        structure: "A double membrane encloses stroma and a thylakoid system arranged into grana.",
        function: "Light-dependent reactions occur on thylakoids; carbon fixation occurs in the stroma.",
        markingPoints: ["thylakoid membrane", "grana", "stroma", "circular DNA and 70S ribosomes"],
        trap: "Not every plant cell contains chloroplasts; root cells usually do not.",
        seenIn: "Photosynthetic plant and algal cells.",
      },
      {
        id: "central-vacuole",
        name: "Central vacuole",
        colour: "#55c8ff",
        kicker: "Water and solute reservoir",
        structure: "A large fluid-filled compartment bounded by the tonoplast.",
        function: "Stores cell sap and helps maintain turgor pressure for mechanical support.",
        markingPoints: ["tonoplast", "cell sap", "water potential", "turgor"],
        trap: "The vacuole is not an empty space; it contains a solution of ions and organic substances.",
        seenIn: "Especially prominent in mature plant cells.",
      },
      {
        id: "mitochondrion",
        name: "Mitochondrion",
        colour: "#ff9e5c",
        kicker: "ATP-generating organelle",
        structure: "A double membrane encloses a matrix; the inner membrane folds into cristae.",
        function: "Aerobic respiration couples electron transport and chemiosmosis to ATP synthesis.",
        markingPoints: ["cristae", "matrix", "electron transport chain", "ATP synthase"],
        trap: "Both plant and animal cells respire and therefore contain mitochondria.",
        seenIn: "Most aerobic eukaryotic cells.",
      },
      {
        id: "golgi",
        name: "Golgi apparatus",
        colour: "#ffcf66",
        kicker: "Modify · sort · dispatch",
        structure: "Stacks of flattened membrane-bound cisternae with associated vesicles.",
        function: "Modifies proteins and lipids, then sorts them into vesicles for specific destinations.",
        markingPoints: ["cisternae", "cis and trans faces", "modification", "secretory vesicles"],
        trap: "Protein synthesis occurs on ribosomes, not in the Golgi apparatus.",
        seenIn: "Eukaryotic cells.",
      },
      {
        id: "rough-er",
        name: "Rough ER",
        colour: "#ef6f9d",
        kicker: "Protein processing network",
        structure: "Flattened membrane cisternae continuous with the nuclear envelope and studded with ribosomes.",
        function: "Synthesises and begins processing proteins destined for secretion or membranes.",
        markingPoints: ["cisternae", "bound ribosomes", "continuous with nuclear envelope", "transport vesicles"],
        trap: "Free ribosomes mainly make cytosolic proteins; bound ribosomes make exported or membrane proteins.",
        seenIn: "Secretory eukaryotic cells are especially rich in rough ER.",
      },
      {
        id: "ribosome",
        name: "Ribosome",
        colour: "#f6f1d5",
        kicker: "Site of translation",
        structure: "A non-membranous complex of rRNA and proteins with large and small subunits.",
        function: "Reads mRNA and catalyses peptide-bond formation during polypeptide synthesis.",
        markingPoints: ["rRNA and proteins", "large and small subunits", "translation", "peptide bonds"],
        trap: "Cytosolic eukaryotic ribosomes are 80S; chloroplast and mitochondrial ribosomes are 70S.",
        seenIn: "Every living cell.",
      },
    ],
  },
  animal: {
    key: "animal",
    name: "Animal cell",
    subtitle: "Eukaryotic · heterotrophic",
    accent: "#7bdcff",
    description: "A flexible cell model for secretion, intracellular digestion, signalling and respiration.",
    organelles: [],
  },
  prokaryote: {
    key: "prokaryote",
    name: "Prokaryotic cell",
    subtitle: "Bacterium · no membrane-bound nucleus",
    accent: "#ffbd70",
    description: "A compact bacterial model for distinguishing prokaryotic organisation from eukaryotic cells.",
    organelles: [],
  },
};

const COMMON = CELL_MODELS.plant.organelles;
const pick = (ids: string[]) => COMMON.filter((item) => ids.includes(item.id));

CELL_MODELS.animal.organelles = [
  ...pick(["cell-membrane", "nucleus", "mitochondrion", "golgi", "rough-er", "ribosome"]),
  {
    id: "lysosome",
    name: "Lysosome",
    colour: "#ff6d8d",
    kicker: "Intracellular digestion",
    structure: "A single-membrane vesicle containing acid hydrolase enzymes.",
    function: "Breaks down engulfed material, macromolecules and worn-out organelles.",
    markingPoints: ["single membrane", "acid hydrolases", "low internal pH", "autophagy"],
    trap: "Lysosomes are formed through the endomembrane system, not by mitochondria.",
    seenIn: "Prominent in many animal cells, especially phagocytes.",
  },
  {
    id: "centriole",
    name: "Centriole",
    colour: "#ffd45d",
    kicker: "Microtubule organiser",
    structure: "A cylinder built from nine triplets of microtubules; centrioles usually occur as a pair.",
    function: "Contributes to spindle organisation and forms basal bodies for cilia and flagella.",
    markingPoints: ["nine microtubule triplets", "centrosome", "spindle organisation"],
    trap: "Most higher plant cells organise spindles without centrioles.",
    seenIn: "Typical animal cells and many protists.",
  },
];

CELL_MODELS.prokaryote.organelles = [
  {
    id: "capsule",
    name: "Capsule",
    colour: "#b9f7e8",
    kicker: "Protective outer coat",
    structure: "A well-organised extracellular layer, commonly polysaccharide in composition.",
    function: "Reduces desiccation, assists adhesion and may protect against phagocytosis.",
    markingPoints: ["external to wall", "polysaccharide", "adhesion", "anti-phagocytic"],
    trap: "A capsule is not present in every bacterial species.",
    seenIn: "Some bacteria.",
  },
  {
    id: "cell-wall",
    name: "Bacterial cell wall",
    colour: "#ffbd70",
    kicker: "Peptidoglycan support",
    structure: "A rigid layer containing peptidoglycan outside the plasma membrane.",
    function: "Maintains shape and protects the cell against osmotic lysis.",
    markingPoints: ["peptidoglycan", "outside plasma membrane", "prevents osmotic lysis"],
    trap: "Bacterial walls contain peptidoglycan, not cellulose.",
    seenIn: "Most bacteria; absent in Mycoplasma.",
  },
  {
    id: "plasma-membrane",
    name: "Plasma membrane",
    colour: "#40d9b2",
    kicker: "Metabolic boundary",
    structure: "A phospholipid bilayer with proteins but usually no cholesterol.",
    function: "Regulates transport and carries enzymes involved in respiration and other metabolic processes.",
    markingPoints: ["phospholipid bilayer", "transport", "respiratory enzymes"],
    trap: "Prokaryotes do not have mitochondria; respiration occurs at the plasma membrane and in the cytosol.",
    seenIn: "Every living cell.",
  },
  {
    id: "nucleoid",
    name: "Nucleoid",
    colour: "#b48cff",
    kicker: "Main bacterial chromosome",
    structure: "A non-membrane-bound region containing usually one circular, double-stranded DNA molecule.",
    function: "Carries essential genes and directs cellular activity and replication.",
    markingPoints: ["not membrane-bound", "circular DNA", "double stranded", "main chromosome"],
    trap: "The nucleoid is not a true nucleus and has no nuclear envelope.",
    seenIn: "Prokaryotic cells.",
  },
  {
    id: "plasmid",
    name: "Plasmid",
    colour: "#ff73aa",
    kicker: "Accessory DNA",
    structure: "A small circular DNA molecule that replicates independently of the bacterial chromosome.",
    function: "Carries non-essential but advantageous genes, such as antibiotic-resistance genes.",
    markingPoints: ["small circular DNA", "independent replication", "accessory genes"],
    trap: "Plasmids are not essential for basic survival under all conditions.",
    seenIn: "Many bacteria; number and type vary.",
  },
  {
    ...COMMON.find((item) => item.id === "ribosome")!,
    name: "70S ribosome",
    structure: "A non-membranous 70S particle formed from 50S and 30S subunits.",
    markingPoints: ["70S", "50S and 30S subunits", "translation", "rRNA and proteins"],
    trap: "The sedimentation values are not additive: 50S + 30S forms a 70S ribosome, not 80S.",
  },
  {
    id: "flagellum",
    name: "Flagellum",
    colour: "#ffe09a",
    kicker: "Rotary locomotion",
    structure: "A filament connected through a hook to a basal motor in the cell envelope.",
    function: "Rotates to propel a motile bacterium through a fluid environment.",
    markingPoints: ["filament", "hook", "basal body", "rotation"],
    trap: "A bacterial flagellum is structurally different from the 9+2 eukaryotic flagellum.",
    seenIn: "Motile bacterial species.",
  },
];

const PROCESSES: Record<ProcessKey, {
  name: string;
  short: string;
  syllabus: string;
  steps: { title: string; copy: string; output: string }[];
}> = {
  protein: {
    name: "Protein secretion",
    short: "Nucleus → RER → Golgi → membrane",
    syllabus: "Connect gene expression with the endomembrane system.",
    steps: [
      { title: "Transcription", copy: "A gene is copied into pre-mRNA and processed to form mature mRNA.", output: "mRNA" },
      { title: "Translation", copy: "A bound ribosome translates the mRNA into a polypeptide entering the rough ER.", output: "Polypeptide" },
      { title: "Modification", copy: "ER and Golgi cisternae fold, modify and sort the protein.", output: "Processed protein" },
      { title: "Exocytosis", copy: "A secretory vesicle fuses with the plasma membrane and releases its cargo.", output: "Secreted product" },
    ],
  },
  atp: {
    name: "ATP production",
    short: "Electron transfer → H⁺ gradient → ATP synthase",
    syllabus: "Link mitochondrial ultrastructure to oxidative phosphorylation.",
    steps: [
      { title: "Reduced carriers", copy: "NADH and FADH₂ deliver high-energy electrons to the respiratory chain.", output: "Electrons" },
      { title: "Proton pumping", copy: "Electron transfer powers H⁺ movement across the inner mitochondrial membrane.", output: "H⁺ gradient" },
      { title: "Chemiosmosis", copy: "H⁺ returns to the matrix through ATP synthase.", output: "Proton flow" },
      { title: "Phosphorylation", copy: "ATP synthase couples proton flow to phosphorylation of ADP.", output: "ATP" },
    ],
  },
  water: {
    name: "Water movement",
    short: "Water potential gradient → osmosis → cell response",
    syllabus: "Predict plant, animal and bacterial cell responses to water-potential changes.",
    steps: [
      { title: "Gradient", copy: "A difference in water potential exists across a selectively permeable membrane.", output: "Driving force" },
      { title: "Osmosis", copy: "Water moves from higher water potential to lower water potential.", output: "Net water flow" },
      { title: "Pressure", copy: "The cell contents press against the boundary as volume changes.", output: "Pressure change" },
      { title: "Outcome", copy: "Cell wall presence determines whether the cell becomes turgid or risks lysis.", output: "Cell response" },
    ],
  },
};

const PROKARYOTE_PROCESSES: typeof PROCESSES = {
  protein: {
    name: "Protein synthesis",
    short: "Nucleoid → mRNA → 70S ribosome",
    syllabus: "Contrast coupled bacterial transcription and translation with eukaryotic gene expression.",
    steps: [
      { title: "Transcription", copy: "RNA polymerase copies a gene from the nucleoid DNA into mRNA in the cytosol.", output: "mRNA" },
      { title: "Ribosome binding", copy: "A 70S ribosome binds the mRNA; translation may begin before transcription is complete.", output: "Initiation complex" },
      { title: "Elongation", copy: "tRNAs deliver amino acids while the ribosome forms peptide bonds.", output: "Polypeptide" },
      { title: "Folding", copy: "The new polypeptide folds or is directed to the plasma membrane for export.", output: "Functional protein" },
    ],
  },
  atp: {
    name: "Respiratory ATP",
    short: "Plasma membrane → H⁺ gradient → ATP synthase",
    syllabus: "Explain how a prokaryote respires without mitochondria.",
    steps: [
      { title: "Electron donors", copy: "Reduced carriers deliver electrons to a respiratory chain in the plasma membrane.", output: "Electrons" },
      { title: "Proton pumping", copy: "Electron transfer drives H⁺ from the cytosol to the outside of the membrane.", output: "H⁺ gradient" },
      { title: "Chemiosmosis", copy: "H⁺ returns to the cytosol through membrane-bound ATP synthase.", output: "Proton flow" },
      { title: "ATP formation", copy: "ATP synthase phosphorylates ADP using energy from the proton motive force.", output: "ATP" },
    ],
  },
  water: {
    name: "Osmotic protection",
    short: "Water potential → osmosis → wall resistance",
    syllabus: "Relate the bacterial cell wall to survival in a hypotonic environment.",
    steps: [
      { title: "Gradient", copy: "The external solution and cytosol have different water potentials.", output: "Driving force" },
      { title: "Osmosis", copy: "Water moves across the selectively permeable plasma membrane.", output: "Net water flow" },
      { title: "Expansion", copy: "Water entry increases the pressure exerted by the protoplast on the wall.", output: "Internal pressure" },
      { title: "Wall response", copy: "Peptidoglycan resists expansion and reduces the risk of osmotic lysis.", output: "Protected cell" },
    ],
  },
};

const COMPARISON = [
  ["Membrane-bound nucleus", "Present", "Present", "Absent"],
  ["Cell wall", "Cellulose", "Absent", "Peptidoglycan*"],
  ["Ribosomes", "80S cytosolic", "80S cytosolic", "70S"],
  ["Circular DNA", "In chloroplasts and mitochondria", "In mitochondria", "Main chromosome + plasmids"],
  ["ATP-producing membrane", "Mitochondrial inner membrane", "Mitochondrial inner membrane", "Plasma membrane"],
];

function colourMaterial(colour: string, opacity = 1, roughness = 0.38) {
  return new THREE.MeshPhysicalMaterial({
    color: colour,
    transparent: opacity < 1,
    opacity,
    roughness,
    metalness: 0.04,
    clearcoat: 0.3,
    side: THREE.DoubleSide,
  });
}

function CellCanvas({
  cell,
  selectedId,
  onSelect,
  rotate,
  cutaway,
  isolate,
  process,
  progress,
  resetSignal,
}: {
  cell: CellKey;
  selectedId: string;
  onSelect: (id: string) => void;
  rotate: boolean;
  cutaway: boolean;
  isolate: boolean;
  process: ProcessKey;
  progress: number;
  resetSignal: number;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(progress);
  const rotateRef = useRef(rotate);
  const onSelectRef = useRef(onSelect);

  useEffect(() => { progressRef.current = progress; }, [progress]);
  useEffect(() => { rotateRef.current = rotate; }, [rotate]);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2("#07191d", 0.035);
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(8.8, 6.2, 10.5);

    const probe = document.createElement("canvas");
    if (!probe.getContext("webgl2") && !probe.getContext("webgl")) {
      mount.dataset.renderMode = "diagram";
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      mount.dataset.renderMode = "diagram";
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 7;
    controls.maxDistance = 19;
    controls.target.set(0, 0, 0);

    scene.add(new THREE.HemisphereLight("#bfffee", "#071012", 2.4));
    const keyLight = new THREE.DirectionalLight("#ffffff", 3.4);
    keyLight.position.set(7, 9, 8);
    scene.add(keyLight);
    const rim = new THREE.PointLight("#5ad8ff", 35, 25);
    rim.position.set(-7, 1, -4);
    scene.add(rim);
    const warm = new THREE.PointLight("#ffad65", 26, 22);
    warm.position.set(6, -4, 4);
    scene.add(warm);

    const cellGroup = new THREE.Group();
    cellGroup.rotation.x = -0.08;
    scene.add(cellGroup);
    const interactive: THREE.Object3D[] = [];

    const register = (object: THREE.Object3D, id: string, boundary = false) => {
      object.userData.organelle = id;
      object.userData.boundary = boundary;
      interactive.push(object);
      cellGroup.add(object);
      return object;
    };

    const mesh = (
      geometry: THREE.BufferGeometry,
      colour: string,
      id: string,
      position: [number, number, number],
      scale: [number, number, number] = [1, 1, 1],
      opacity = 1,
      boundary = false,
    ) => {
      const item = new THREE.Mesh(geometry, colourMaterial(colour, opacity, boundary ? 0.25 : 0.42));
      item.position.set(...position);
      item.scale.set(...scale);
      item.userData.baseScale = item.scale.clone();
      register(item, id, boundary);
      return item;
    };

    const addRibosomes = (count: number, spread: [number, number, number], id = "ribosome") => {
      const group = new THREE.Group();
      group.userData.organelle = id;
      for (let index = 0; index < count; index += 1) {
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.055, 10, 8),
          colourMaterial("#fff4c4", 0.96, 0.75),
        );
        const angle = index * 2.399;
        const radius = 0.35 + ((index * 17) % 100) / 100 * spread[0];
        dot.position.set(
          Math.cos(angle) * radius,
          ((((index * 29) % 100) / 100) - 0.5) * spread[1],
          Math.sin(angle) * radius * spread[2],
        );
        group.add(dot);
      }
      group.userData.baseScale = group.scale.clone();
      register(group, id);
    };

    const addMito = (position: [number, number, number], rotation = 0) => {
      const mito = mesh(new THREE.SphereGeometry(0.55, 28, 20), "#ff9156", "mitochondrion", position, [1.45, 0.72, 0.72]);
      mito.rotation.z = rotation;
      const cristae = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.25, 0.035, 54, 8, 2, 3),
        colourMaterial("#ffd08a", 0.94, 0.6),
      );
      cristae.scale.set(1.2, 0.55, 0.55);
      mito.add(cristae);
    };

    const addGolgi = (position: [number, number, number]) => {
      const group = new THREE.Group();
      group.position.set(...position);
      group.userData.baseScale = group.scale.clone();
      group.userData.organelle = "golgi";
      for (let index = 0; index < 5; index += 1) {
        const cisterna = new THREE.Mesh(
          new THREE.TorusGeometry(0.55 + index * 0.07, 0.055, 9, 36, Math.PI * 1.35),
          colourMaterial("#ffd36c", 0.98, 0.5),
        );
        cisterna.position.y = (index - 2) * 0.16;
        cisterna.rotation.x = Math.PI / 2;
        cisterna.rotation.z = -0.55;
        group.add(cisterna);
      }
      register(group, "golgi");
    };

    const addRoughER = (position: [number, number, number]) => {
      const group = new THREE.Group();
      group.position.set(...position);
      group.userData.baseScale = group.scale.clone();
      for (let index = 0; index < 4; index += 1) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.74 + index * 0.16, 0.045, 8, 54, Math.PI * 1.45),
          colourMaterial("#e86f9b", 0.92, 0.55),
        );
        ring.rotation.set(Math.PI / 2, 0.25, index * 0.2 - 0.45);
        ring.position.y = (index - 1.5) * 0.16;
        group.add(ring);
      }
      register(group, "rough-er");
    };

    if (cell === "plant") {
      mesh(new RoundedBoxGeometry(7.4, 5.4, 3.5, 6, 0.5), "#7bd84c", "cell-wall", [0, 0, 0], [1, 1, 1], cutaway ? 0.10 : 0.22, true);
      mesh(new RoundedBoxGeometry(6.9, 4.9, 3.15, 6, 0.6), "#41d4b1", "cell-membrane", [0, 0, 0], [1, 1, 1], cutaway ? 0.08 : 0.16, true);
      mesh(new THREE.SphereGeometry(0.9, 36, 26), "#9b75f0", "nucleus", [-1.45, 0.65, 0.25], [1, 1, 0.9]);
      mesh(new THREE.SphereGeometry(1, 36, 24), "#55c9ff", "central-vacuole", [0.9, -0.1, -0.15], [1.75, 1.5, 0.92], 0.62);
      [[-2.25, -1.2, 0.45], [2.4, 1.35, -0.25], [2.5, -1.25, 0.35], [0.2, 1.65, 0.55]].forEach((p, index) => {
        const chloroplast = mesh(new THREE.SphereGeometry(0.48, 26, 18), "#35d570", "chloroplast", p as [number, number, number], [1.45, 0.68, 0.72]);
        chloroplast.rotation.z = index * 0.7;
        for (let stack = -1; stack <= 1; stack += 1) {
          const granum = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.05, 18), colourMaterial("#b7f56d"));
          granum.rotation.z = Math.PI / 2;
          granum.position.set(stack * 0.22, 0, 0.18);
          chloroplast.add(granum);
        }
      });
      addMito([-2.35, 1.55, -0.45], -0.35);
      addMito([2.4, 0.2, 0.65], 0.8);
      addGolgi([-0.75, -1.35, 0.65]);
      addRoughER([-1.35, 0.65, -0.15]);
      addRibosomes(62, [2.8, 3.7, 0.7]);
    } else if (cell === "animal") {
      mesh(new THREE.SphereGeometry(3.4, 52, 36), "#3dd5be", "cell-membrane", [0, 0, 0], [1.15, 0.92, 0.78], cutaway ? 0.08 : 0.18, true);
      mesh(new THREE.SphereGeometry(1.05, 40, 28), "#9a75f4", "nucleus", [-0.65, 0.55, 0.25], [1, 1, 0.9]);
      addMito([-2.2, -1.05, 0.5], 0.45);
      addMito([1.75, 1.3, -0.2], -0.8);
      addMito([1.9, -1.15, 0.35], 0.25);
      addGolgi([0.85, -0.15, 0.85]);
      addRoughER([-0.55, 0.55, -0.3]);
      [[-1.8, 1.55, 0.7], [1.25, 0.8, 0.85], [0.25, -1.65, 0.6]].forEach((p) => {
        mesh(new THREE.SphereGeometry(0.32, 22, 16), "#ff6d8d", "lysosome", p as [number, number, number]);
      });
      const centrioleGroup = new THREE.Group();
      centrioleGroup.position.set(0.35, 1.4, 0.5);
      centrioleGroup.userData.baseScale = centrioleGroup.scale.clone();
      for (let i = 0; i < 2; i += 1) {
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.75, 12, 1, true), colourMaterial("#ffd45d"));
        barrel.rotation.z = i ? Math.PI / 2 : 0.2;
        barrel.position.x = i ? 0.25 : -0.15;
        centrioleGroup.add(barrel);
      }
      register(centrioleGroup, "centriole");
      addRibosomes(68, [2.7, 4.0, 0.78]);
    } else {
      mesh(new THREE.SphereGeometry(2.45, 48, 30), "#b8f4e6", "capsule", [0, 0, 0], [1.65, 0.82, 0.78], cutaway ? 0.07 : 0.13, true);
      mesh(new THREE.SphereGeometry(2.2, 48, 30), "#ffb96b", "cell-wall", [0, 0, 0], [1.65, 0.82, 0.78], cutaway ? 0.08 : 0.18, true);
      mesh(new THREE.SphereGeometry(2.02, 48, 30), "#40d9b2", "plasma-membrane", [0, 0, 0], [1.65, 0.82, 0.78], cutaway ? 0.08 : 0.14, true);
      const nucleoid = mesh(new THREE.TorusKnotGeometry(0.8, 0.08, 100, 12, 2, 5), "#b58cff", "nucleoid", [0, 0.1, 0.15], [1.65, 0.72, 0.65]);
      nucleoid.rotation.x = 0.7;
      [[-1.6, 0.75, 0.35], [1.15, -0.7, 0.6]].forEach((p, index) => {
        const plasmid = mesh(new THREE.TorusGeometry(0.28 + index * 0.06, 0.035, 10, 34), "#ff72aa", "plasmid", p as [number, number, number]);
        plasmid.rotation.set(0.7, 0.2, index * 0.9);
      });
      addRibosomes(90, [2.65, 2.15, 0.72]);
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(3.2, 0, 0), new THREE.Vector3(4.1, 0.4, 0.2), new THREE.Vector3(4.9, -0.35, 0.15), new THREE.Vector3(5.8, 0.2, 0),
      ]);
      const flagellum = new THREE.Mesh(new THREE.TubeGeometry(curve, 70, 0.055, 8, false), colourMaterial("#ffe09a"));
      flagellum.userData.baseScale = flagellum.scale.clone();
      register(flagellum, "flagellum");
    }

    const focusObjects = interactive.filter((object) => object.userData.organelle === selectedId);
    interactive.forEach((object) => {
      const id = object.userData.organelle as string;
      const keep = !isolate || id === selectedId || object.userData.boundary;
      object.visible = keep;
      object.traverse((child) => {
        const maybeMesh = child as THREE.Mesh;
        const material = maybeMesh.material as THREE.MeshPhysicalMaterial | undefined;
        if (!material || !material.color) return;
        if (id === selectedId) {
          material.emissive = new THREE.Color(material.color).multiplyScalar(0.42);
          material.emissiveIntensity = 0.9;
        } else if (isolate && !object.userData.boundary) {
          material.opacity = Math.min(material.opacity, 0.08);
        }
      });
    });

    const particleGroup = new THREE.Group();
    const particleMaterial = colourMaterial(process === "protein" ? "#f9e773" : process === "atp" ? "#6fffe2" : "#71d8ff", 0.96, 0.2);
    for (let index = 0; index < 22; index += 1) {
      const particle = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), particleMaterial);
      particle.userData.offset = index / 22;
      particleGroup.add(particle);
    }
    cellGroup.add(particleGroup);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const handlePointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(interactive, true)[0];
      if (!hit) return;
      let target: THREE.Object3D | null = hit.object;
      while (target && !target.userData.organelle) target = target.parent;
      if (target?.userData.organelle) onSelectRef.current(target.userData.organelle as string);
    };
    renderer.domElement.addEventListener("pointerdown", handlePointer);

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(5.8, 80),
      new THREE.MeshBasicMaterial({ color: "#10353a", transparent: true, opacity: 0.22 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3.25;
    scene.add(floor);

    const clock = new THREE.Clock();
    let animationFrame = 0;
    const animate = () => {
      const elapsed = clock.getElapsedTime();
      controls.autoRotate = rotateRef.current;
      controls.autoRotateSpeed = 0.65;
      controls.update();

      focusObjects.forEach((object, index) => {
        const base = object.userData.baseScale as THREE.Vector3 | undefined;
        if (base) object.scale.copy(base).multiplyScalar(1 + Math.sin(elapsed * 2.5 + index) * 0.035);
      });

      const activeAmount = Math.max(0.08, progressRef.current / 100);
      particleGroup.visible = progressRef.current > 0;
      particleGroup.children.forEach((child, index) => {
        const offset = child.userData.offset as number;
        const t = (elapsed * 0.09 + offset) % 1;
        child.visible = t <= activeAmount + 0.08;
        if (process === "protein") {
          const path = [
            new THREE.Vector3(-1.2, 0.7, 1), new THREE.Vector3(-0.4, 0.1, 1.15), new THREE.Vector3(0.65, -0.4, 1.1), new THREE.Vector3(2.6, 0.45, 1.1),
          ];
          const scaled = t * (path.length - 1);
          const segment = Math.min(path.length - 2, Math.floor(scaled));
          child.position.lerpVectors(path[segment], path[segment + 1], scaled - segment);
        } else if (process === "atp") {
          const radius = 1.5 + (index % 4) * 0.18;
          child.position.set(Math.cos(t * Math.PI * 2) * radius, -0.8 + Math.sin((t + offset) * Math.PI * 4) * 0.55, Math.sin(t * Math.PI * 2) * 0.85 + 0.8);
        } else {
          child.position.set(-4.2 + t * 8.4, Math.sin(index * 1.7) * 2.2, Math.cos(index * 0.8) * 1.25);
        }
      });

      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", handlePointer);
      controls.dispose();
      scene.traverse((object) => {
        const maybeMesh = object as THREE.Mesh;
        maybeMesh.geometry?.dispose?.();
        const material = maybeMesh.material;
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else material?.dispose?.();
      });
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
    };
  }, [cell, selectedId, cutaway, isolate, process, resetSignal]);

  return <div className="cell-canvas" ref={mountRef} aria-label={`Interactive 3D model of a ${CELL_MODELS[cell].name}`} />;
}

function CellFallback({ cell, selectedId }: { cell: CellKey; selectedId: string }) {
  const active = (id: string) => selectedId === id ? "active" : "";
  if (cell === "plant") {
    return (
      <div className="cell-fallback plant-diagram" aria-hidden="true">
        <div className={`diagram-boundary wall ${active("cell-wall")}`} />
        <div className={`diagram-boundary membrane ${active("cell-membrane")}`} />
        <div className={`diagram-organelle vacuole ${active("central-vacuole")}`} />
        <div className={`diagram-organelle nucleus ${active("nucleus")}`}><i /></div>
        <div className={`diagram-organelle chloroplast c1 ${active("chloroplast")}`}><i /><i /><i /></div>
        <div className={`diagram-organelle chloroplast c2 ${active("chloroplast")}`}><i /><i /><i /></div>
        <div className={`diagram-organelle chloroplast c3 ${active("chloroplast")}`}><i /><i /><i /></div>
        <div className={`diagram-organelle mitochondrion m1 ${active("mitochondrion")}`}><i /></div>
        <div className={`diagram-organelle mitochondrion m2 ${active("mitochondrion")}`}><i /></div>
        <div className={`diagram-organelle golgi ${active("golgi")}`}><i /><i /><i /><i /></div>
        <div className={`diagram-organelle rough-er ${active("rough-er")}`}><i /><i /><i /></div>
        <div className={`diagram-ribosomes ${active("ribosome")}`}>{Array.from({ length: 18 }, (_, index) => <i key={index} />)}</div>
      </div>
    );
  }
  if (cell === "animal") {
    return (
      <div className="cell-fallback animal-diagram" aria-hidden="true">
        <div className={`diagram-boundary membrane ${active("cell-membrane")}`} />
        <div className={`diagram-organelle nucleus ${active("nucleus")}`}><i /></div>
        <div className={`diagram-organelle mitochondrion m1 ${active("mitochondrion")}`}><i /></div>
        <div className={`diagram-organelle mitochondrion m2 ${active("mitochondrion")}`}><i /></div>
        <div className={`diagram-organelle mitochondrion m3 ${active("mitochondrion")}`}><i /></div>
        <div className={`diagram-organelle golgi ${active("golgi")}`}><i /><i /><i /><i /></div>
        <div className={`diagram-organelle rough-er ${active("rough-er")}`}><i /><i /><i /></div>
        <div className={`diagram-organelle lysosome l1 ${active("lysosome")}`} />
        <div className={`diagram-organelle lysosome l2 ${active("lysosome")}`} />
        <div className={`diagram-organelle centriole ${active("centriole")}`}><i /><i /></div>
        <div className={`diagram-ribosomes ${active("ribosome")}`}>{Array.from({ length: 18 }, (_, index) => <i key={index} />)}</div>
      </div>
    );
  }
  return (
    <div className="cell-fallback prokaryote-diagram" aria-hidden="true">
      <div className={`diagram-boundary capsule ${active("capsule")}`} />
      <div className={`diagram-boundary bacterial-wall ${active("cell-wall")}`} />
      <div className={`diagram-boundary bacterial-membrane ${active("plasma-membrane")}`} />
      <div className={`diagram-organelle nucleoid ${active("nucleoid")}`}><i /><i /><i /></div>
      <div className={`diagram-organelle plasmid p1 ${active("plasmid")}`} />
      <div className={`diagram-organelle plasmid p2 ${active("plasmid")}`} />
      <div className={`diagram-organelle flagellum ${active("flagellum")}`} />
      <div className={`diagram-ribosomes ${active("ribosome")}`}>{Array.from({ length: 24 }, (_, index) => <i key={index} />)}</div>
    </div>
  );
}

function Icon({ children }: { children: React.ReactNode }) {
  return <span className="mini-icon" aria-hidden="true">{children}</span>;
}

export default function CellStudio() {
  const [cell, setCell] = useState<CellKey>("plant");
  const [selectedId, setSelectedId] = useState("nucleus");
  const [rotate, setRotate] = useState(true);
  const [cutaway, setCutaway] = useState(true);
  const [isolate, setIsolate] = useState(false);
  const [process, setProcess] = useState<ProcessKey>("protein");
  const [progress, setProgress] = useState(22);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [resetSignal, setResetSignal] = useState(0);
  const [markingOpen, setMarkingOpen] = useState(false);
  const [confidence, setConfidence] = useState(2);
  const [compareOpen, setCompareOpen] = useState(false);

  const model = CELL_MODELS[cell];
  const selected = model.organelles.find((item) => item.id === selectedId) ?? model.organelles[0];
  const processLibrary = cell === "prokaryote" ? PROKARYOTE_PROCESSES : PROCESSES;
  const processData = processLibrary[process];
  const activeStep = Math.min(processData.steps.length - 1, Math.floor(progress / 25));

  useEffect(() => {
    if (!model.organelles.some((item) => item.id === selectedId)) {
      setSelectedId(cell === "prokaryote" ? "nucleoid" : "nucleus");
    }
    setIsolate(false);
    setMarkingOpen(false);
  }, [cell, model.organelles, selectedId]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setProgress((value) => {
        const next = value + 0.8 * speed;
        if (next >= 100) {
          setPlaying(false);
          return 100;
        }
        return next;
      });
    }, 70);
    return () => window.clearInterval(timer);
  }, [playing, speed]);

  const recallPrompt = useMemo(() => {
    if (cell === "prokaryote") return `State two structural features of the ${selected.name} and link one feature to its function.`;
    return `Using precise A/L terminology, explain how the structure of the ${selected.name} supports its function.`;
  }, [cell, selected.name]);

  const chooseCell = (next: CellKey) => {
    setCell(next);
    setSelectedId(next === "prokaryote" ? "nucleoid" : "nucleus");
    setProcess("protein");
    setProgress(12);
    setPlaying(false);
  };

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#studio" aria-label="Cell Architecture Studio home">
          <span className="brand-mark"><span /><span /><span /></span>
          <span>
            <strong>Cell Architecture Studio</strong>
            <small>Build the picture. Score the marks.</small>
          </span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#studio">Studio</a>
          <a href="#processes">Processes</a>
          <a href="#recall">Active recall</a>
        </nav>
        <span className="syllabus-pill">G.C.E. A/L · Unit 02</span>
      </header>

      <section className="mission-strip">
        <span className="eyebrow">ENGLISH MEDIUM · CELL STRUCTURE & FUNCTION</span>
        <p><strong>Today’s loop:</strong> locate → describe → link structure to function → retrieve without labels.</p>
        <div className="mission-progress" aria-label="Lesson progress"><span style={{ width: "38%" }} /></div>
        <span>3 / 8 structures secured</span>
      </section>

      <section className="transfer-banner panel" aria-label="Exam transfer instruction">
        <div><span className="eyebrow">EXAM TRANSFER</span><strong>After every model, draw one unseen cell and justify two differences.</strong></div>
        <span>Structure → function → marking point</span>
      </section>

      <section className="studio" id="studio">
        <aside className="model-rail panel">
          <div className="panel-heading">
            <span className="eyebrow">MODEL LIBRARY</span>
            <strong>Choose a specimen</strong>
          </div>
          <div className="model-list">
            {(Object.keys(CELL_MODELS) as CellKey[]).map((key) => {
              const item = CELL_MODELS[key];
              return (
                <button
                  className={`model-card ${cell === key ? "active" : ""}`}
                  key={key}
                  onClick={() => chooseCell(key)}
                  style={{ "--model-accent": item.accent } as React.CSSProperties}
                  aria-pressed={cell === key}
                >
                  <span className={`cell-glyph ${key}`}><i /><i /><i /></span>
                  <span><strong>{item.name}</strong><small>{item.subtitle}</small></span>
                  <b>{cell === key ? "LIVE" : "OPEN"}</b>
                </button>
              );
            })}
          </div>

          <div className="rail-divider" />
          <div className="panel-heading compact">
            <span className="eyebrow">STRUCTURES</span>
            <strong>{model.organelles.length} selectable</strong>
          </div>
          <div className="structure-list">
            {model.organelles.map((organelle, index) => (
              <button
                key={organelle.id}
                className={selected.id === organelle.id ? "active" : ""}
                onClick={() => setSelectedId(organelle.id)}
                aria-pressed={selected.id === organelle.id}
              >
                <span className="structure-index">{String(index + 1).padStart(2, "0")}</span>
                <i style={{ background: organelle.colour }} />
                <span>{organelle.name}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="viewport-panel panel">
          <div className="viewport-head">
            <div>
              <span className="eyebrow">INTERACTIVE CELL MODEL</span>
              <h1>{model.name}</h1>
              <p>{model.description}</p>
            </div>
            <div className="live-badge"><span /> PROCEDURAL 3D</div>
          </div>

          <div className="canvas-wrap">
            <CellFallback cell={cell} selectedId={selected.id} />
            <CellCanvas
              cell={cell}
              selectedId={selected.id}
              onSelect={setSelectedId}
              rotate={rotate}
              cutaway={cutaway}
              isolate={isolate}
              process={process}
              progress={progress}
              resetSignal={resetSignal}
            />
            <div className="canvas-hint"><Icon>↔</Icon> drag to rotate <span /> scroll to zoom <span /> click a structure</div>
            <div className="focus-chip" style={{ "--focus-colour": selected.colour } as React.CSSProperties}>
              <i /> <span>FOCUS</span> <strong>{selected.name}</strong>
            </div>
            <div className="scale-readout"><span>0</span><i /><span>10 μm</span></div>
          </div>

          <div className="view-controls" aria-label="3D view controls">
            <button className={rotate ? "active" : ""} onClick={() => setRotate((value) => !value)} aria-pressed={rotate}><Icon>↻</Icon> Auto rotate</button>
            <button className={cutaway ? "active" : ""} onClick={() => setCutaway((value) => !value)} aria-pressed={cutaway}><Icon>◐</Icon> Cutaway</button>
            <button className={isolate ? "active" : ""} onClick={() => setIsolate((value) => !value)} aria-pressed={isolate}><Icon>◎</Icon> Isolate</button>
            <button onClick={() => setResetSignal((value) => value + 1)}><Icon>⌂</Icon> Reset view</button>
          </div>
        </div>

        <aside className="inspector panel">
          <div className="inspector-top" style={{ "--focus-colour": selected.colour } as React.CSSProperties}>
            <span className="eyebrow">SELECTED STRUCTURE</span>
            <div className="organelle-orb"><span /><span /></div>
            <h2>{selected.name}</h2>
            <p>{selected.kicker}</p>
          </div>

          <dl className="fact-grid">
            <div><dt>Structure</dt><dd>{selected.structure}</dd></div>
            <div><dt>Function</dt><dd>{selected.function}</dd></div>
            <div><dt>Where?</dt><dd>{selected.seenIn}</dd></div>
          </dl>

          <div className="trap-card">
            <span>MCQ TRAP</span>
            <p>{selected.trap}</p>
          </div>

          <div className="confidence-row">
            <span><small>SELF-RATING</small><strong>{["Not yet", "Shaky", "Secure", "Exam ready"][confidence]}</strong></span>
            <div role="group" aria-label="Confidence rating">
              {[0, 1, 2, 3].map((value) => <button key={value} className={confidence === value ? "active" : ""} onClick={() => setConfidence(value)} aria-label={`Confidence ${value + 1}`}>{value + 1}</button>)}
            </div>
          </div>
        </aside>
      </section>

      <section className="process-panel panel" id="processes">
        <div className="section-title-row">
          <div><span className="eyebrow">BIOCHEMICAL PROCESSES</span><h2>Make the model explain the sequence.</h2></div>
          <p>{processData.syllabus}</p>
        </div>

        <div className="process-tabs" role="tablist" aria-label="Biochemical processes">
          {(Object.keys(processLibrary) as ProcessKey[]).map((key) => (
            <button key={key} className={process === key ? "active" : ""} onClick={() => { setProcess(key); setProgress(12); setPlaying(false); }} role="tab" aria-selected={process === key}>
              <Icon>{key === "protein" ? "⌁" : key === "atp" ? "⚡" : "≋"}</Icon>
              <span><strong>{processLibrary[key].name}</strong><small>{processLibrary[key].short}</small></span>
            </button>
          ))}
        </div>

        <div className="process-workbench">
          <div className="process-controller">
            <div className="controller-head">
              <span>PROCESS SIMULATION</span>
              <strong>{Math.round(progress)}%</strong>
            </div>
            <div className="controller-buttons">
              <button className="play-button" onClick={() => { if (progress >= 100) setProgress(0); setPlaying((value) => !value); }}><Icon>{playing ? "Ⅱ" : "▶"}</Icon>{playing ? "Pause" : "Play"}</button>
              <button onClick={() => { setProgress(0); setPlaying(false); }}><Icon>↶</Icon>Reset</button>
              <span className="speed-group">{[0.5, 1, 2].map((value) => <button key={value} className={speed === value ? "active" : ""} onClick={() => setSpeed(value)}>{value}×</button>)}</span>
            </div>
            <input aria-label="Process progress" type="range" min="0" max="100" value={progress} onChange={(event) => { setProgress(Number(event.target.value)); setPlaying(false); }} />
            <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
            <p><span className="pulse-dot" /> Current readout: <strong>{processData.steps[activeStep].output}</strong></p>
          </div>

          <div className="step-grid">
            {processData.steps.map((step, index) => (
              <button key={step.title} className={index === activeStep ? "active" : index < activeStep ? "done" : ""} onClick={() => { setProgress(index * 25 + 8); setPlaying(false); }}>
                <span>{index < activeStep ? "✓" : index + 1}</span>
                <strong>{step.title}</strong>
                <p>{step.copy}</p>
                <small>{step.output}</small>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="recall-layout" id="recall">
        <article className="recall-card panel">
          <div className="section-title-row">
            <div><span className="eyebrow">90-SECOND ACTIVE RECALL</span><h2>Close the labels. Produce the marks.</h2></div>
            <span className="timer">01:30</span>
          </div>
          <div className="prompt-box">
            <span>STRUCTURE–FUNCTION PROMPT</span>
            <p>{recallPrompt}</p>
          </div>
          <textarea aria-label="Type your recall answer" placeholder="Type or say your answer before revealing the marking points…" />
          <div className="recall-actions">
            <button className="primary" onClick={() => setMarkingOpen((value) => !value)}>{markingOpen ? "Hide marking points" : "Reveal marking points"}</button>
            <button onClick={() => setSelectedId(model.organelles[(model.organelles.indexOf(selected) + 1) % model.organelles.length].id)}>Next structure →</button>
          </div>
          {markingOpen && (
            <div className="marking-points" aria-live="polite">
              <span>MARKING-SCHEME WORDS</span>
              <ul>{selected.markingPoints.map((point) => <li key={point}>{point}</li>)}</ul>
              <p>Now improve your answer by making one explicit <strong>structure → function</strong> link.</p>
            </div>
          )}
        </article>

        <article className="compare-card panel">
          <div className="section-title-row">
            <div><span className="eyebrow">COMPARISON MODE</span><h2>Three cells. Five discriminators.</h2></div>
            <button className="compare-toggle" onClick={() => setCompareOpen((value) => !value)}>{compareOpen ? "Compact view" : "Expand table"}</button>
          </div>
          <div className="compare-hero">
            <div><span className="compare-cell plant"><i /></span><strong>Plant</strong></div>
            <span>vs</span>
            <div><span className="compare-cell animal"><i /></span><strong>Animal</strong></div>
            <span>vs</span>
            <div><span className="compare-cell prokaryote"><i /></span><strong>Prokaryote</strong></div>
          </div>
          <div className={`comparison-table ${compareOpen ? "open" : ""}`}>
            <div className="comparison-row header"><span>Feature</span><span>Plant</span><span>Animal</span><span>Prokaryote</span></div>
            {COMPARISON.slice(0, compareOpen ? COMPARISON.length : 3).map((row) => (
              <div className="comparison-row" key={row[0]}>{row.map((cellValue, index) => <span key={`${row[0]}-${index}`}>{cellValue}</span>)}</div>
            ))}
          </div>
          <small className="comparison-note">*Most bacterial species; <i>Mycoplasma</i> lacks a cell wall.</small>
        </article>
      </section>

      <footer>
        <div><span className="brand-mark small"><span /><span /><span /></span><strong>Cell Architecture Studio</strong></div>
        <p>Original interactive study build · English-medium G.C.E. A/L Biology · Designed for retrieval, not passive viewing.</p>
        <a href="#studio">Back to model ↑</a>
      </footer>
    </main>
  );
}
