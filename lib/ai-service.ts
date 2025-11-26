import { QuestionWithAnswer } from '@/types';
import { generateId } from './utils';

/**
 * Simulated AI service.
 * - If fileContent is provided, attempt to parse MCQs from the text.
 * - If a prompt is provided, generate a number of questions based on the prompt.
 *   The prompt can contain a number (e.g. "35 MCQs about React").
 */
export async function generateQuestionsFromAI(
    prompt: string,
    fileContent?: string
): Promise<QuestionWithAnswer[]> {
    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (fileContent) {
        return parseContentWithHeuristics(fileContent);
    }

    if (prompt && prompt.trim().length > 0) {
        return generateMockQuestions(prompt);
    }

    return [];
}

/** Simple heuristic parser for uploaded text files. */
function parseContentWithHeuristics(content: string): QuestionWithAnswer[] {
    // Check for empty content (e.g. scanned PDF)
    if (!content || content.trim().length === 0) {
        return [
            {
                id: generateId(),
                text: 'Parsing Failed: No text could be read from the PDF. This usually happens with scanned PDFs or images. Please use a text-based PDF (selectable text) or convert your file to .txt.',
                options: [
                    { id: 'A', text: 'Use a text-based PDF' },
                    { id: 'B', text: 'Convert to .txt file' },
                    { id: 'C', text: 'Type questions manually' },
                    { id: 'D', text: 'Use OCR software first' }
                ],
                correct_option_id: 'A',
                meta: { source_file: 'uploaded_file', difficulty: 'medium' }
            }
        ];
    }

    // Normalize content: remove carriage returns, trim lines
    const lines = content
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l.length > 0);

    const questions: QuestionWithAnswer[] = [];
    let current: Partial<QuestionWithAnswer> | null = null;

    // Regex patterns - Enhanced for flexibility
    // Matches: "1.", "1 .", "1)", "Q1:", "Q1.", "Question 1:"
    const questionStartRegex = /^(?:Q\s*\d+|Question\s*\d+|\d+)\s*[\.:\)]\s*(.+)/i;

    // Matches: "A.", "a)", "(A)", "(a)", "A ", "a "
    const optionStartRegex = /^\s*(?:[A-D]|[a-d])\s*[\.:\)]\s*(.+)|^\s*\((?:[A-D]|[a-d])\)\s*(.+)|^\s*(?:[A-D]|[a-d])\s+(.+)/i;

    // Matches: "Ans:", "Answer:", "Correct:", "Answer Key:", "Ans -"
    const answerRegex = /^\s*(?:Ans|Answer|Correct|Correct\s*Option|Correct\s*Answer|Answer\s*Key)[\s:-]*([A-D])/i;

    // Helper to check if a line is likely a page number or footer
    const isGarbage = (line: string) => {
        return /^\d+$/.test(line) || /^Page\s+\d+/i.test(line);
    };

    try {
        for (const line of lines) {
            if (isGarbage(line)) continue;

            // Check for Answer first
            const answerMatch = line.match(answerRegex);
            if (answerMatch && current) {
                current.correct_option_id = answerMatch[1].toUpperCase();
                continue;
            }

            // Check for Option
            const optionMatch = line.match(optionStartRegex);
            if (optionMatch && current) {
                // Determine which capture group matched
                const optText = (optionMatch[1] || optionMatch[2] || optionMatch[3]).trim();

                // Extract the letter (A, B, C, D)
                const optIdMatch = line.match(/^\s*(?:([A-D]|[a-d]))/i);
                const optId = optIdMatch ? optIdMatch[1].toUpperCase() : 'A';

                if (!current.options) current.options = [];
                current.options.push({ id: optId, text: optText });
                continue;
            }

            // Check for Question Start
            const questionMatch = line.match(questionStartRegex);
            if (questionMatch) {
                // Save previous question if valid
                if (current && current.text && current.options && current.options.length > 1) {
                    if (!current.correct_option_id) current.correct_option_id = current.options[0].id;
                    questions.push(current as QuestionWithAnswer);
                }

                // Start new question
                current = {
                    id: generateId(),
                    text: questionMatch[1].trim(),
                    options: [],
                    meta: { source_file: 'uploaded_file', difficulty: 'medium' }
                };
                continue;
            }

            // If it's just text and we have a current question but no options yet, append to question text (multi-line question)
            if (current && (!current.options || current.options.length === 0)) {
                current.text += ' ' + line;
            }
        }

        // Push last question
        if (current && current.text && current.options && current.options.length > 1) {
            if (!current.correct_option_id) current.correct_option_id = current.options[0].id;
            questions.push(current as QuestionWithAnswer);
        }
    } catch (e) {
        console.warn("Standard parsing failed:", e);
    }

    // Fallback: Try "Mashed Content" parser for table layouts (missing newlines)
    if (questions.length === 0) {
        try {
            const mashedQuestions = parseMashedContent(content);
            if (mashedQuestions.length > 0) {
                return mashedQuestions;
            }
        } catch (e) {
            console.warn("Mashed content parsing failed:", e);
        }
    }

    // Final Fallback
    if (questions.length === 0) {
        console.warn("Parsing failed. Content preview:", content.substring(0, 200));
        return [
            {
                id: generateId(),
                text: 'Parsing Failed. Here is what we read from your file (first 500 chars). Please check if the format matches our expectations:\n\n' + content.substring(0, 500),
                options: [
                    { id: 'A', text: 'Format your PDF correctly' },
                    { id: 'B', text: 'Use standard numbering' },
                    { id: 'C', text: 'Check for "Answer:" lines' },
                    { id: 'D', text: 'Try converting to text file' }
                ],
                correct_option_id: 'A',
                meta: { source_file: 'uploaded_file', difficulty: 'medium' }
            }
        ];
    }

    return questions;
}

/** 
 * Parser for "mashed" content where newlines are missing (common in PDF tables).
 * Heuristic: Questions end in '?', followed by options, ending with a single letter Answer.
 */
function parseMashedContent(content: string): QuestionWithAnswer[] {
    try {
        const questions: QuestionWithAnswer[] = [];

        // Remove potential headers like "QuestionOption A..."
        let cleanContent = content;
        try {
            cleanContent = content.replace(/Question\s*Option\s*A.*Correct\s*Answer/i, '');
        } catch (e) {
            // Ignore regex error
        }

        // Regex to find: [Question Text]? [Options] [AnswerLetter] [Lookahead for next Q]
        const mashedRegex = /([^?]+)\?\s*(.+?)([A-D])(?=\s*[A-Z]|$)/g;

        let match;
        let loopCount = 0;
        const MAX_LOOPS = 500;

        while ((match = mashedRegex.exec(cleanContent)) !== null) {
            loopCount++;
            if (loopCount > MAX_LOOPS) break;

            const qText = match[1].trim();
            const optionsRaw = match[2].trim();
            const answer = match[3];

            if (qText.length < 5) continue;

            const optionsSplit = optionsRaw.split(/(?=[A-Z])/).filter(s => s.trim().length > 0);

            let options: { id: string, text: string }[] = [];
            if (optionsSplit.length >= 4) {
                if (optionsSplit.length === 4) {
                    options = [
                        { id: 'A', text: optionsSplit[0].trim() },
                        { id: 'B', text: optionsSplit[1].trim() },
                        { id: 'C', text: optionsSplit[2].trim() },
                        { id: 'D', text: optionsSplit[3].trim() }
                    ];
                } else {
                    options = optionsSplit.slice(0, 4).map((text, idx) => ({
                        id: String.fromCharCode(65 + idx),
                        text: text.trim()
                    }));
                }
            } else {
                options = optionsSplit.map((text, idx) => ({
                    id: String.fromCharCode(65 + idx),
                    text: text.trim()
                }));
            }

            questions.push({
                id: generateId(),
                text: qText + '?',
                options: options,
                correct_option_id: answer,
                meta: { source_file: 'uploaded_file', difficulty: 'medium' }
            });
        }

        return questions;
    } catch (error) {
        console.error("Error in parseMashedContent:", error);
        return [];
    }
}

/** Generate mock questions based on a prompt. */
function generateMockQuestions(prompt: string): QuestionWithAnswer[] {
    // Extract a topic and optional count from the prompt
    const topicMatch = prompt.match(/about\s+([^,.;!]+)/i) || prompt.match(/on\s+([^,.;!]+)/i);
    const topic = topicMatch ? topicMatch[1].trim() : 'General Knowledge';
    const countMatch = prompt.match(/(\d+)\s+(?:mcq|questions|question)/i);
    const count = countMatch ? parseInt(countMatch[1], 10) : 3;

    const templates = [
        {
            text: (t: string) => `What is the primary purpose of ${t}?`,
            options: [
                { id: 'A', text: 'To improve performance' },
                { id: 'B', text: 'To increase complexity' },
                { id: 'C', text: 'To reduce security' },
                { id: 'D', text: 'None of the above' }
            ],
            correct: 'A',
            explanation: (t: string) => `${t} is mainly used to optimize and improve system performance.`
        },
        {
            text: (t: string) => `Which of the following is a key feature of ${t}?`,
            options: [
                { id: 'A', text: 'Manual memory management' },
                { id: 'B', text: 'Scalability and flexibility' },
                { id: 'C', text: 'Single-threaded execution only' },
                { id: 'D', text: 'Requires expensive hardware' }
            ],
            correct: 'B',
            explanation: (t: string) => `Scalability is one of the defining features of ${t}.`
        },
        {
            text: (t: string) => `When should you use ${t} in a project?`,
            options: [
                { id: 'A', text: 'Never, it is deprecated' },
                { id: 'B', text: 'Only for small scripts' },
                { id: 'C', text: 'When you need robust data handling' },
                { id: 'D', text: 'For styling only' }
            ],
            correct: 'C',
            explanation: (t: string) => `${t} is ideal for scenarios requiring strong data management capabilities.`
        },
        {
            text: (t: string) => `What is a common misconception about ${t}?`,
            options: [
                { id: 'A', text: 'It is easy to learn' },
                { id: 'B', text: 'It is only for frontend' },
                { id: 'C', text: 'It does not support async operations' },
                { id: 'D', text: 'It is extremely slow' }
            ],
            correct: 'B',
            explanation: (t: string) => `Many people incorrectly assume ${t} is limited to a specific domain, which is not true.`
        },
        {
            text: (t: string) => `How does ${t} handle errors?`,
            options: [
                { id: 'A', text: 'It ignores them' },
                { id: 'B', text: 'Using try-catch blocks' },
                { id: 'C', text: 'By crashing the system' },
                { id: 'D', text: 'It does not have error handling' }
            ],
            correct: 'B',
            explanation: (t: string) => `Standard error handling in ${t} involves try-catch mechanisms.`
        }
    ];

    const generated: QuestionWithAnswer[] = [];
    for (let i = 0; i < count; i++) {
        const template = templates[i % templates.length];
        generated.push({
            id: generateId(),
            text: `Q${i + 1}: ${template.text(topic)}`,
            options: template.options.map(o => ({ ...o })), // Clone options
            correct_option_id: template.correct,
            explanation: template.explanation(topic),
            meta: { difficulty: i % 3 === 0 ? 'hard' : i % 2 === 0 ? 'medium' : 'easy' }
        });
    }
    return generated;
}
