import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

import { askAi } from "../services/openRouter.service.js";

import Interview from "../models/interview.model.js";
import User from "../models/user.model.js";

export const analyzeResume = async (req, res) => {
    try {

        // Check uploaded resume
        if (!req.file) {
            return res.status(400).json({
                message: "Resume required"
            });
        }

        // Uploaded file path
        const filepath = req.file.path;

        // Read PDF
        const fileBuffer = await fs.promises.readFile(filepath);

        // Convert Buffer to Uint8Array
        const uint8Array = new Uint8Array(fileBuffer);

        // Load PDF
        const pdf = await pdfjsLib.getDocument({
            data: uint8Array
        }).promise;

        let resumeText = "";

        // Extract text from all pages
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {

            const page = await pdf.getPage(pageNum);

            const content = await page.getTextContent();

            const pageText = content.items
                .map(item => item.str)
                .join(" ");

            resumeText += pageText + "\n";
        }

        // Clean text
        resumeText = resumeText
            .replace(/\s+/g, " ")
            .trim();

        // AI Prompt
        const message = [
            {
                role: "system",
                content: `
Extract structured data from the resume.

Return ONLY valid JSON.

{
    "role":"string",
    "experience":"string",
    "projects":["project1","project2"],
    "skills":["skill1","skill2"]
}
`
            },
            {
                role: "user",
                content: resumeText
            }
        ];

        // Ask AI
        const aiResponse = await askAi(message);

        console.log("========== AI RESPONSE ==========");
        console.log(aiResponse);
        console.log("================================");

        // Parse AI response
        const cleaned = aiResponse
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const parsed = JSON.parse(cleaned);

        // Delete uploaded PDF
        await fs.promises.unlink(filepath);

        return res.json({
            role: parsed.role,
            experience: parsed.experience,
            projects: parsed.projects,
            skills: parsed.skills,
            resumeText
        });

    } catch (error) {

        console.log(error);

        if (req.file && fs.existsSync(req.file.path)) {
            await fs.promises.unlink(req.file.path);
        }

        return res.status(500).json({
            message: error.message
        });
    }
};







export const generateQuestion = async (req, res) => {
    try {

        let {
            role,
            experience,
            mode,
            resumeText,
            projects,
            skills
        } = req.body;

        role = role?.trim();
        experience = experience?.trim();
        mode = mode?.trim();

        if (
            !role ||
            !experience ||
            !mode ||
            !resumeText ||
            !projects ||
            !skills
        ) {
            return res.status(400).json({
                message: "Role, Experience and Mode are required."
            });
        }

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        if (user.credits < 50) {
            return res.status(400).json({
                message: "Not enough credits. Minimum 50 required."
            });
        }

        const projectText =
            Array.isArray(projects) && projects.length
                ? projects.join(", ")
                : "None";

        const skillsText =
            Array.isArray(skills) && skills.length
                ? skills.join(", ")
                : "None";

        const safeResume = resumeText?.trim() || "None";

        const userPrompt = `
Role: ${role}
Experience: ${experience}
Interview Mode: ${mode}
Projects: ${projectText}
Skills: ${skillsText}
Resume: ${safeResume}
`;

        if (!userPrompt.trim()) {
            return res.status(400).json({
                message: "Prompt content is empty."
            });
        }

        const message = [
            {
                role: "system",
                content: `
You are a real human interviewer conducting a professional interview.

Speak in simple, natural English as if you are talking directly to the candidate.

Generate exactly 5 interview questions.

Strict Rules:
- Each question must contain between 15 and 25 words.
- Each question must be a single complete sentence.
- Do not number them.
- Do not add explanations.
- Do not add extra text before or after.
- One question per line only.
- Keep the language simple and conversational.
- Questions must feel practical and realistic.

Difficulty Progression:
Question 1 - Easy
Question 2 - Easy
Question 3 - Medium
Question 4 - Medium
Question 5 - Hard

Generate questions based on:
- Role
- Experience
- Interview Mode
- Projects
- Skills
- Resume
`
            },
            {
                role: "user",
                content: userPrompt
            }
        ];

        const aiResponse = await askAi(message);

        if (!aiResponse || !aiResponse.trim()) {
            console.log("AI returned an empty response.")
            return res.status(500).json({
                message: "AI returned an empty response."
            });
            console.log("AI returned an empty response.")
        }

        const questionsArray = aiResponse
            .split("\n")
            .map(q => q.trim())
            .filter(q => q.length > 0)
            .slice(0, 5);

        if (questionsArray.length === 0) {
            console.log("AI failed to generate questions.")
            return res.status(500).json({
                message: "AI failed to generate questions."
            });
        }

        user.credits -= 50;
        await user.save();
        console.log("Saved userId:", user._id);

        const interview = await Interview.create({
            userId: user._id,
            role,
            experience,
            mode,
            resumeText: safeResume,
            questions: questionsArray.map((q, index) => ({
                question: q,
                difficulty: ["easy", "easy", "medium", "medium", "hard"][index],
                timeLimit: [60, 60, 90, 90, 120][index]
            }))
        });
        console.log("Interview Saved:", interview);

        return res.json({
            interviewId: interview._id,
            creditsLeft: user.credits,
            userName: user.name,
            questions: interview.questions
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: error.message
        });
    }
};



export const submitAnswer = async (req, res) => {
    try {

        const {
            interviewId,
            questionIndex,
            answer,
            timeTaken
        } = req.body;

        // Find Interview
        const interview = await Interview.findById(interviewId);

        if (!interview) {
            return res.status(404).json({
                message: "Interview not found."
            });
        }

        // Find Question
        const question = interview.questions[questionIndex];

        if (!question) {
            return res.status(404).json({
                message: "Question not found."
            });
        }

        // Empty Answer
        if (!answer || answer.trim() === "") {

            question.answer = "";
            question.score = 0;
            question.confidence = 0;
            question.communication = 0;
            question.correctness = 0;
            question.feedback = "You did not submit an answer.";

            await interview.save();

            return res.status(200).json({
                feedback: question.feedback
            });
        }

        // Time Limit Exceeded
        if (timeTaken > question.timeLimit) {

            question.answer = answer;
            question.score = 0;
            question.confidence = 0;
            question.communication = 0;
            question.correctness = 0;
            question.feedback = "Time limit exceeded. Answer was not evaluated.";

            await interview.save();

            return res.status(200).json({
                feedback: question.feedback
            });
        }

        // AI Prompt
        const messages = [
            {
                role: "system",
                content: `
You are a professional human interviewer evaluating a candidate's answer in a real interview.

Evaluate the answer fairly and naturally.

Score the answer from 0 to 10 in these areas:

1. Confidence
- Is the answer clear and confidently presented?

2. Communication
- Is the answer easy to understand and well structured?

3. Correctness
- Is the answer accurate, relevant and complete?

Rules:
- Be realistic and unbiased.
- Do not give random high scores.
- Weak answers should receive low scores.
- Strong answers should receive high scores.
- Consider clarity, structure and relevance.

Calculate:
finalScore = Average of Confidence, Communication and Correctness.
Round to the nearest whole number.

Feedback Rules:
- Write natural interview feedback.
- 10 to 15 words only.
- Professional and honest.
- Suggest improvement if needed.
- Don't repeat the question.

Return ONLY valid JSON.

{
    "confidence":8,
    "communication":8,
    "correctness":9,
    "finalScore":8,
    "feedback":"Clear answer with good confidence. Add more practical examples."
}
`
            },
            {
                role: "user",
                content: `
Question:
${question.question}

Answer:
${answer}
`
            }
        ];

        // Ask AI
        const aiResponse = await askAi(messages);

        // Remove markdown if AI returns ```json
        const cleaned = aiResponse
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const parsed = JSON.parse(cleaned);

        // Save Answer
        question.answer = answer;
       question.confidence = Number(parsed.confidence) || 0;
question.communication = Number(parsed.communication) || 0;
question.correctness = Number(parsed.correctness) || 0;
question.score = Number(parsed.finalScore) || 0;
        question.feedback = parsed.feedback;

        await interview.save();

        return res.status(200).json({
            confidence: parsed.confidence,
            communication: parsed.communication,
            correctness: parsed.correctness,
            score: parsed.finalScore,
            feedback: parsed.feedback
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: `Failed to submit answer: ${error.message}`
        });
    }
};



export const finishInterview = async (req, res) => {
  try {
    const { interviewId } = req.body;

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({
        message: "Failed to find interview.",
      });
    }

    const totalQuestions = interview.questions.length;

    let totalScore = 0;
    let totalConfidence = 0;
    let totalCommunication = 0;
    let totalCorrectness = 0;

    interview.questions.forEach((q) => {
      totalScore += Number(q.score) || 0;
      totalConfidence += Number(q.confidence) || 0;
      totalCommunication += Number(q.communication) || 0;
      totalCorrectness += Number(q.correctness) || 0;
    });

    const finalScore = totalQuestions
      ? totalScore / totalQuestions
      : 0;

    const avgConfidence = totalQuestions
      ? totalConfidence / totalQuestions
      : 0;

    const avgCommunication = totalQuestions
      ? totalCommunication / totalQuestions
      : 0;

    const avgCorrectness = totalQuestions
      ? totalCorrectness / totalQuestions
      : 0;

    interview.finalScore = Number(
      finalScore.toFixed(1)
    );

    interview.status = "completed";

    await interview.save();

    return res.status(200).json({
      finalScore: Number(finalScore.toFixed(1)),
      confidence: Number(avgConfidence.toFixed(1)),
      communication: Number(avgCommunication.toFixed(1)),
      correctness: Number(avgCorrectness.toFixed(1)),

      questionWiseScore: interview.questions.map(
        (q) => ({
          question: q.question,
          answer: q.answer,
          score: Number(q.score) || 0,
          feedback: q.feedback || "",
          confidence: Number(q.confidence) || 0,
          communication: Number(q.communication) || 0,
          correctness: Number(q.correctness) || 0,
        })
      ),
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: `Failed to finish interview: ${error.message}`,
    });
  }
};




export const getMyInterviews = async (req, res) => {
  try {
    console.log("Logged in User:", req.userId);

    const interviews = await Interview.find({
      userId: req.userId,
    })
      .sort({ createdAt: -1 })
      .select("role experience mode finalScore status createdAt");

    console.log("Found Interviews:", interviews);

    return res.status(200).json(interviews);
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getInterviewReport = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    const totalQuestions = interview.questions.length;

    let totalConfidence = 0;
    let totalCommunication = 0;
    let totalCorrectness = 0;

    interview.questions.forEach((q) => {
      totalConfidence += q.confidence || 0;
      totalCommunication += q.communication || 0;
      totalCorrectness += q.correctness || 0;
    });

    const avgConfidence = totalQuestions
      ? totalConfidence / totalQuestions
      : 0;

    const avgCommunication = totalQuestions
      ? totalCommunication / totalQuestions
      : 0;

    const avgCorrectness = totalQuestions
      ? totalCorrectness / totalQuestions
      : 0;

    return res.status(200).json({
      finalScore: interview.finalScore,
      confidence: Number(avgConfidence.toFixed(1)),
      communication: Number(avgCommunication.toFixed(1)),
      correctness: Number(avgCorrectness.toFixed(1)),
      questionWiseScore: interview.questions,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

