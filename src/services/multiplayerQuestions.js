const QUESTION_BANK = [
  {
    category: 'Math',
    question: '2 + 2 = ?',
    options: ['3', '4', '5', '6'],
    answer: 'B',
  },
  {
    category: 'Math',
    question: '9 + 0 = ?',
    options: ['8', '9', '10', '0'],
    answer: 'B',
  },
  {
    category: 'Math',
    question: '7 + 5 = ?',
    options: ['10', '11', '12', '13'],
    answer: 'C',
  },
  {
    category: 'Math',
    question: '15 - 6 = ?',
    options: ['7', '8', '9', '10'],
    answer: 'C',
  },
  {
    category: 'Math',
    question: '4 × 3 = ?',
    options: ['7', '10', '12', '14'],
    answer: 'C',
  },
  {
    category: 'Math',
    question: '20 ÷ 4 = ?',
    options: ['4', '5', '6', '8'],
    answer: 'B',
  },
  {
    category: 'Math',
    question: '8 + 7 = ?',
    options: ['13', '14', '15', '16'],
    answer: 'C',
  },

  {
    category: 'Alphabet',
    question: 'What comes before F?',
    options: ['D', 'E', 'G', 'H'],
    answer: 'B',
  },
  {
    category: 'Alphabet',
    question: 'What comes after M?',
    options: ['L', 'N', 'O', 'P'],
    answer: 'B',
  },
  {
    category: 'Alphabet',
    question: 'A, B, C, D, ?',
    options: ['E', 'F', 'G', 'H'],
    answer: 'A',
  },
  {
    category: 'Alphabet',
    question: 'Z, Y, X, ?',
    options: ['V', 'W', 'U', 'T'],
    answer: 'B',
  },
  {
    category: 'Alphabet',
    question: 'A, C, E, G, ?',
    options: ['H', 'I', 'J', 'K'],
    answer: 'B',
  },

  {
    category: 'Number Pattern',
    question: '2, 4, 6, 8, ?',
    options: ['9', '10', '11', '12'],
    answer: 'B',
  },
  {
    category: 'Number Pattern',
    question: '5, 10, 15, 20, ?',
    options: ['21', '22', '24', '25'],
    answer: 'D',
  },
  {
    category: 'Number Pattern',
    question: '1, 3, 5, 7, ?',
    options: ['8', '9', '10', '11'],
    answer: 'B',
  },
  {
    category: 'Number Pattern',
    question: '10, 20, 30, 40, ?',
    options: ['45', '50', '55', '60'],
    answer: 'B',
  },
  {
    category: 'Number Pattern',
    question: '3, 6, 9, 12, ?',
    options: ['13', '14', '15', '16'],
    answer: 'C',
  },

  {
    category: 'Logic',
    question: 'Which number is the largest?',
    options: ['12', '21', '18', '9'],
    answer: 'B',
  },
  {
    category: 'Logic',
    question: 'Which number is even?',
    options: ['7', '11', '14', '19'],
    answer: 'C',
  },
  {
    category: 'Logic',
    question: 'Which number is smallest?',
    options: ['4', '9', '2', '7'],
    answer: 'C',
  },
  {
    category: 'Logic',
    question: 'If today is Monday, what comes next?',
    options: ['Sunday', 'Tuesday', 'Friday', 'Saturday'],
    answer: 'B',
  },
];

function shuffle(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));

    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

export function generateQuestions(count = 10) {
  const shuffled = shuffle(QUESTION_BANK);

  return Array.from({ length: count }, (_, index) => {
    const source = shuffled[index % shuffled.length];

    return {
      question_number: index + 1,
      category: source.category,
      question: source.question,
      option_a: source.options[0],
      option_b: source.options[1],
      option_c: source.options[2],
      option_d: source.options[3],
      correct_answer: source.answer,
    };
  });
}