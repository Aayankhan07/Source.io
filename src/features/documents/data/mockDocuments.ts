import { DocumentRow, FlashcardRow, NoteRow, PodcastRow, QuizRow } from "@/features/documents/types";

export interface DemoDocumentData {
  document: DocumentRow;
  note: NoteRow;
  cards: FlashcardRow[];
  quiz: QuizRow;
  podcast: PodcastRow;
  citations: { n: number; sim: number; text: string }[];
}

export const DEMO_DOCUMENTS: Record<string, DemoDocumentData> = {
  "demo-quantum": {
    document: {
      id: "demo-quantum",
      title: "Introduction to Quantum Computing",
      source_type: "pdf",
      status: "ready",
      error_code: null,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    note: {
      id: "note-quantum",
      document_id: "demo-quantum",
      markdown: `### 1. Fundamental Quantum Mechanics

Quantum Computing leverages the unique principles of quantum physics to solve complex calculations that would take classical supercomputers millennia:

*   **Superposition**: A state where quantum systems contain multiple values simultaneously until measured. A qubit state is expressed mathematically as:
    $$\\|\\psi\\rangle = \\alpha\\|0\\rangle + \\beta\\|1\\rangle$$
    where $|\\alpha|^2 + |\\beta|^2 = 1$.
*   **Entanglement**: Spooky correlation between qubits, locking their states instantly across distance:
    $$\\|\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}}(\\|00\\rangle + \\|11\\rangle)$$
*   **Decoherence**: Environmental noise causing qubits to lose their quantum state. This is the biggest engineering hurdle in contemporary quantum architectures.

---

### 2. Quantum vs. Classical State Comparison

| Architectural Property | Classical Computers | Quantum Computers |
| :--- | :--- | :--- |
| **Core Information Unit** | Bits (deterministic $0$ or $1$) | Qubits (coherent $|0\\rangle$, $|1\\rangle$, or linear superposition) |
| **State Vector Scaling** | Linear ($N$ bits store $N$ states) | Exponential ($N$ qubits span $2^N$ complex amplitudes) |
| **Entanglement** | Impossible (strictly local) | Supported natively via Bell states |
| **Error Mechanisms** | Rare bit-flip | Continuous phase errors, amplitude damping, thermal decoherence |

> **Key Takeaway**: Quantum algorithms like Shor's and Grover's do not simply try everything faster; they use quantum interference to cancel incorrect candidate answers and amplify the correct probability amplitude.`,
    },
    cards: [
      {
        id: "card-q1",
        document_id: "demo-quantum",
        front: "What is Quantum Superposition?",
        back: "The principle allowing a qubit to exist as a linear combination of |0⟩ and |1⟩ until physical measurement forces a state collapse.",
        order_index: 0,
      },
      {
        id: "card-q2",
        document_id: "demo-quantum",
        front: "What is Quantum Entanglement?",
        back: "A non-local correlation between qubits where measuring one instantaneously determines the state of the other, regardless of physical separation.",
        order_index: 1,
      },
      {
        id: "card-q3",
        document_id: "demo-quantum",
        front: "What causes quantum decoherence?",
        back: "Unwanted interaction with the thermal environment, vibrations, or electromagnetic radiation destroying quantum phase coherence.",
        order_index: 2,
      },
      {
        id: "card-q4",
        document_id: "demo-quantum",
        front: "How does Grover's search algorithm improve upon classical search?",
        back: "It provides a quadratic speedup: searching an unsorted database of N items takes O(√N) queries instead of O(N).",
        order_index: 3,
      },
    ],
    quiz: {
      id: "quiz-quantum",
      document_id: "demo-quantum",
      title: "Quantum Fundamentals Mastery",
      questions: [
        {
          id: "q-1",
          quiz_id: "quiz-quantum",
          question: "Which physical phenomenon describes a qubit losing its quantum state due to thermal noise?",
          type: "mcq",
          choices: ["Quantum Entanglement", "Environmental Decoherence", "Superposition Collapse", "Phase Inversion"],
          correct: "Environmental Decoherence",
          explanation: "Decoherence is the progressive loss of quantum coherence caused by unwanted interactions with the external environment.",
          order_index: 0,
        },
        {
          id: "q-2",
          quiz_id: "quiz-quantum",
          question: "An n-qubit quantum register can represent 2^n complex probability amplitudes simultaneously.",
          type: "true_false",
          choices: null,
          correct: "True",
          explanation: "Because of tensor products of 2-state Hilbert spaces, n qubits span a 2^n dimensional vector space.",
          order_index: 1,
        },
        {
          id: "q-3",
          quiz_id: "quiz-quantum",
          question: "What is the primary speedup provided by Shor's algorithm for prime factorisation?",
          type: "mcq",
          choices: ["Polynomial vs exponential classical time", "Linear vs logarithmic time", "Quadratic search time", "Constant O(1) time"],
          correct: "Polynomial vs exponential classical time",
          explanation: "Shor's algorithm factors large integers in polynomial time O((log N)^3), breaking RSA encryption which relies on exponential difficulty.",
          order_index: 2,
        },
      ],
    },
    podcast: {
      id: "pod-quantum",
      document_id: "demo-quantum",
      title: "The Quantum Leap: Demystifying Qubits",
      audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      status: "ready",
      script: JSON.stringify([
        { speaker: "Host A (Dr. Sarah Chen)", text: "Welcome back to Source Studio. Today, we're diving into quantum computation — why everyone is talking about qubits and why it's not just a faster laptop.", timestamp: "0:04" },
        { speaker: "Host B (Marcus)", text: "Right! The biggest misconception is thinking a quantum computer just runs classical code super fast. But the physics is fundamentally different, isn't it?", timestamp: "0:14" },
        { speaker: "Host A (Dr. Sarah Chen)", text: "Exactly. Classical computers use bits: 0 or 1. A qubit can exist in a superposition of both until it's measured.", timestamp: "0:25" },
        { speaker: "Host B (Marcus)", text: "And that exponential space is where the real computational power comes from.", timestamp: "0:36" },
        { speaker: "Host A (Dr. Sarah Chen)", text: "Precisely. But keeping those qubits stable — avoiding decoherence — requires temperatures colder than deep space.", timestamp: "0:48" },
      ]),
    },
    citations: [
      { n: 1, sim: 0.94, text: "Decoherence is the loss of a qubit's quantum state through interaction with its environment." },
      { n: 2, sim: 0.78, text: "Most superconducting designs operate near absolute zero (~15 millikelvin) to limit thermal noise." },
      { n: 3, sim: 0.62, text: "Quantum error correction schemes distribute logical qubits across multiple entangled physical qubits." },
    ],
  },
  "demo-linalg": {
    document: {
      id: "demo-linalg",
      title: "Lecture 07 — Linear Algebra & Eigenvalues",
      source_type: "text",
      status: "ready",
      error_code: null,
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    note: {
      id: "note-linalg",
      document_id: "demo-linalg",
      markdown: `### Linear Transformations & Spectral Decomposition

When a matrix $A$ acts on a vector $x$, it generally changes both the length and direction of $x$. However, certain vectors only undergo scaling:

$$A v = \\lambda v$$

Here, $\\lambda$ is the **eigenvalue** and $v$ is the non-zero **eigenvector**.

#### Key Properties:
1. **Characteristic Equation**: Solved via $\\det(A - \\lambda I) = 0$.
2. **Trace & Determinant**:
   *   $\\text{Tr}(A) = \\sum_{i} \\lambda_i$
   *   $\\det(A) = \\prod_{i} \\lambda_i$
3. **Diagonalization**: If $A$ has $n$ linearly independent eigenvectors, $A = P D P^{-1}$.`,
    },
    cards: [
      {
        id: "card-l1",
        document_id: "demo-linalg",
        front: "What is an eigenvector?",
        back: "A non-zero vector whose direction remains unchanged when a linear transformation is applied, only scaled by its eigenvalue.",
        order_index: 0,
      },
      {
        id: "card-l2",
        document_id: "demo-linalg",
        front: "How do you calculate the eigenvalues of matrix A?",
        back: "Solve the characteristic polynomial equation: det(A - λI) = 0.",
        order_index: 1,
      },
    ],
    quiz: {
      id: "quiz-linalg",
      document_id: "demo-linalg",
      title: "Eigenvalues & Transformations",
      questions: [
        {
          id: "ql-1",
          quiz_id: "quiz-linalg",
          question: "The sum of the eigenvalues of a square matrix is always equal to its:",
          type: "mcq",
          choices: ["Determinant", "Trace", "Rank", "Condition number"],
          correct: "Trace",
          explanation: "The trace of a square matrix equals the sum of its diagonal entries and also equals the sum of its eigenvalues.",
          order_index: 0,
        },
      ],
    },
    podcast: {
      id: "pod-linalg",
      document_id: "demo-linalg",
      title: "Visualizing Eigenvectors with 3Blue1Brown Intuition",
      audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      status: "ready",
      script: JSON.stringify([
        { speaker: "Host A (Dr. Sarah Chen)", text: "Today we are looking at eigenvectors: vectors that stay on their own span after a transformation.", timestamp: "0:04" },
        { speaker: "Host B (Marcus)", text: "It is the foundational building block for PCA, PageRank, and modern machine learning.", timestamp: "0:15" },
      ]),
    },
    citations: [
      { n: 1, sim: 0.91, text: "Eigenvectors satisfy Av = λv and define the invariant axes of linear maps." },
    ],
  },
};

export const DEMO_DOCUMENT_LIST: DocumentRow[] = Object.values(DEMO_DOCUMENTS).map(d => d.document);
