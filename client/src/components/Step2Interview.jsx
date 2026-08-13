import React, { useEffect, useRef, useState } from "react";

import maleVideo from "../assets/videos/male-ai.mp4";
import femaleVideo from "../assets/videos/female-ai.mp4";

import Timer from "./Timer";

import { motion } from "motion/react";

import {
  FaMicrophone,
  FaMicrophoneSlash,
} from "react-icons/fa";

import { BsArrowRight } from "react-icons/bs";

import axios from "axios";

import { ServerUrl } from "../App";

function Step2Interview({ interviewData, onFinish }) {
  const {
    interviewId,
    questions = [],
    userName,
  } = interviewData;

  const [isIntroPhase, setIsIntroPhase] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isAIPlaying, setIsAIPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceGender, setVoiceGender] = useState("female");
  const [subtitle, setSubtitle] = useState("");
  const [isQuestionSpeaking, setIsQuestionSpeaking] =
    useState(false);

  const currentQuestion = questions[currentIndex];

  const [timeLeft, setTimeLeft] = useState(
    currentQuestion?.timeLimit || 60
  );

  const recognitionRef = useRef(null);
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  // ==========================================
  // LOAD SPEECH VOICES
  // ==========================================

  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      console.warn(
        "Speech synthesis is not supported in this browser."
      );
      return;
    }

    const loadVoices = () => {
      const voices =
        window.speechSynthesis.getVoices();

      if (!voices.length) {
        return;
      }

      const femaleVoice = voices.find((voice) => {
        const name = voice.name.toLowerCase();

        return (
          name.includes("zira") ||
          name.includes("samantha") ||
          name.includes("female") ||
          name.includes("google us english female")
        );
      });

      if (femaleVoice) {
        setSelectedVoice(femaleVoice);
        setVoiceGender("female");
        return;
      }

      const maleVoice = voices.find((voice) => {
        const name = voice.name.toLowerCase();

        return (
          name.includes("david") ||
          name.includes("mark") ||
          name.includes("male")
        );
      });

      if (maleVoice) {
        setSelectedVoice(maleVoice);
        setVoiceGender("male");
        return;
      }

      setSelectedVoice(voices[0]);
      setVoiceGender("female");
    };

    loadVoices();

    window.speechSynthesis.onvoiceschanged =
      loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const videoSource =
    voiceGender === "male"
      ? maleVideo
      : femaleVideo;

  // ==========================================
  // SPEAK TEXT
  // ==========================================

  const speakText = (text) => {
    return new Promise((resolve) => {
      if (
        !("speechSynthesis" in window) ||
        !selectedVoice
      ) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      const humanText = text
        .replace(/,/g, ", ... ")
        .replace(/\./g, ". .... ");

      const utterance =
        new SpeechSynthesisUtterance(humanText);

      utterance.voice = selectedVoice;
      utterance.rate = 0.92;
      utterance.pitch = 1.05;
      utterance.volume = 1;

      utterance.onstart = () => {
        setIsAIPlaying(true);

        setSubtitle(text);

        stopMic();

        if (videoRef.current) {
          videoRef.current
            .play()
            .catch((error) => {
              console.log(
                "Video play skipped:",
                error.message
              );
            });
        }
      };

      utterance.onend = () => {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }

        setIsAIPlaying(false);
        setSubtitle("");

        resolve();
      };

      utterance.onerror = (event) => {
        console.error(
          "Speech synthesis error:",
          event.error
        );

        setIsAIPlaying(false);
        setSubtitle("");

        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  };

  // ==========================================
  // MICROPHONE / SPEECH RECOGNITION
  // ==========================================

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error(
        "❌ Speech Recognition is not supported in this browser."
      );

      setIsMicOn(false);
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log("🎤 Microphone started");
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        if (event.results[i].isFinal) {
          finalTranscript +=
            event.results[i][0].transcript;
        }
      }

      const cleanedTranscript =
        finalTranscript.trim();

      if (cleanedTranscript) {
        console.log(
          "🎤 Transcript:",
          cleanedTranscript
        );

        setAnswer((previousAnswer) => {
          if (!previousAnswer.trim()) {
            return cleanedTranscript;
          }

          return `${previousAnswer.trim()} ${cleanedTranscript}`;
        });
      }
    };

    recognition.onerror = (event) => {
      console.error(
        "🎤 Speech Recognition Error:",
        event.error
      );

      if (event.error === "not-allowed") {
        setIsMicOn(false);

        alert(
          "Microphone permission is blocked. Please allow microphone access in Chrome."
        );

        return;
      }

      if (event.error === "audio-capture") {
        setIsMicOn(false);

        alert(
          "No microphone was found. Please check your microphone connection."
        );

        return;
      }

      if (event.error === "network") {
        console.error(
          "Speech recognition network error."
        );
      }

      if (event.error === "aborted") {
        console.log(
          "🎤 Recognition aborted."
        );
      }

      if (event.error === "no-speech") {
        console.log(
          "🎤 No speech detected."
        );
      }
    };

    recognition.onend = () => {
      console.log(
        "🎤 Microphone recognition ended"
      );

      if (
        isMicOn &&
        !isAIPlaying &&
        !isSubmitting &&
        !feedback &&
        !isIntroPhase
      ) {
        setTimeout(() => {
          try {
            recognition.start();

            console.log(
              "🎤 Microphone restarted"
            );
          } catch (error) {
            console.log(
              "🎤 Recognition restart skipped:",
              error.message
            );
          }
        }, 300);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.onend = null;
        recognition.onerror = null;
        recognition.onresult = null;

        recognition.stop();
        recognition.abort();
      } catch (error) {
        console.log(
          "Recognition cleanup:",
          error.message
        );
      }

      recognitionRef.current = null;
    };
  }, [
    isMicOn,
    isAIPlaying,
    isSubmitting,
    feedback,
    isIntroPhase,
  ]);

  // ==========================================
  // START MICROPHONE
  // ==========================================

 const startMic = () => {
  const recognition = recognitionRef.current;

  if (!recognition) {
    console.error(
      "❌ Recognition not initialized"
    );
    return;
  }

  if (
    !isMicOn ||
    isAIPlaying ||
    isSubmitting ||
    feedback ||
    isIntroPhase
  ) {
    return;
  }

  try {
    recognition.start();
    console.log("🎤 Starting recognition...");
  } catch (error) {
    console.log(
      "Recognition already running:",
      error.message
    );
  }
};
  // ==========================================
  // STOP MICROPHONE
  // ==========================================

  const stopMic = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();

        console.log(
          "🎤 Stopping microphone..."
        );
      } catch (error) {
        console.log(
          "Stop microphone:",
          error.message
        );
      }
    }
  };

  // ==========================================
  // TOGGLE MICROPHONE
  // ==========================================

  const toggleMic = async () => {
    if (isMicOn) {
      stopMic();
      setIsMicOn(false);

      console.log(
        "🎤 Microphone turned OFF"
      );

      return;
    }

    setIsMicOn(true);

    console.log(
      "🎤 Microphone turned ON"
    );

    setTimeout(() => {
      startMic();
    }, 300);
  };

  // ==========================================
  // INTRO + QUESTION SPEECH
  // ==========================================

  useEffect(() => {
    if (!selectedVoice) {
      return;
    }

    const runInterviewSpeech = async () => {
      try {
        if (isIntroPhase) {
          await speakText(
            `Hi ${userName}, it's great to meet you today. I hope you're feeling confident and ready.`
          );

          await speakText(
            "I'll ask you a few questions. Just answer naturally, and take your time. Let's begin."
          );

          setIsIntroPhase(false);

          return;
        }

        if (!currentQuestion) {
          return;
        }

        await new Promise((resolve) =>
          setTimeout(resolve, 500)
        );

        if (
          currentIndex ===
          questions.length - 1
        ) {
          await speakText(
            "Alright, this one might be a bit more challenging."
          );
        }

        setIsQuestionSpeaking(true);

        await speakText(
          currentQuestion.question
        );

        setIsQuestionSpeaking(false);

        // Start timer after AI finishes speaking
        setTimeLeft(
          currentQuestion.timeLimit || 60
        );

        if (isMicOn) {
          setTimeout(() => {
            startMic();
          }, 300);
        }
      } catch (error) {
        console.error(
          "❌ Interview speech error:",
          error
        );

        setIsQuestionSpeaking(false);

        if (isIntroPhase) {
          setIsIntroPhase(false);
        }
      }
    };

    runInterviewSpeech();
  }, [
    selectedVoice,
    isIntroPhase,
    currentIndex,
  ]);

  // ==========================================
  // TIMER
  // ==========================================

  useEffect(() => {
    if (isIntroPhase) {
      return;
    }

    if (!currentQuestion) {
      return;
    }

    if (isQuestionSpeaking) {
      return;
    }

    if (feedback) {
      return;
    }

    if (isSubmitting) {
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((previousTime) => {
        if (previousTime <= 1) {
          clearInterval(
            timerRef.current
          );

          return 0;
        }

        return previousTime - 1;
      });
    }, 1000);

    return () => {
      clearInterval(
        timerRef.current
      );
    };
  }, [
    isIntroPhase,
    currentIndex,
    isQuestionSpeaking,
    feedback,
    isSubmitting,
  ]);

  // ==========================================
  // RESET TIMER
  // ==========================================

  useEffect(() => {
    if (
      !isIntroPhase &&
      currentQuestion
    ) {
      setTimeLeft(
        currentQuestion.timeLimit || 60
      );
    }
  }, [
    currentIndex,
    isIntroPhase,
  ]);

  // ==========================================
  // AUTO SUBMIT
  // ==========================================

  useEffect(() => {
    if (isIntroPhase) {
      return;
    }

    if (!currentQuestion) {
      return;
    }

    if (
      timeLeft === 0 &&
      !isSubmitting &&
      !feedback
    ) {
      submitAnswer();
    }
  }, [
    timeLeft,
    isIntroPhase,
  ]);

  // ==========================================
  // SUBMIT ANSWER
  // ==========================================

  const submitAnswer = async () => {
    if (isSubmitting) {
      return;
    }

    if (!answer.trim()) {
      setFeedback(
        "Please provide an answer before continuing."
      );

      return;
    }

    stopMic();

    clearInterval(
      timerRef.current
    );

    setIsSubmitting(true);

    try {
      const result = await axios.post(
        ServerUrl +
          "/api/interview/submit-answer",
        {
          interviewId,

          questionIndex: currentIndex,

          answer: answer.trim(),

          timeTaken:
            (currentQuestion?.timeLimit ||
              60) - timeLeft,
        },
        {
          withCredentials: true,
        }
      );

      const newFeedback =
        result.data.feedback ||
        "Good attempt. Keep practicing.";

      setFeedback(newFeedback);

      await speakText(newFeedback);
    } catch (error) {
      console.error(
        "❌ Submit Answer Error:",
        error
      );

      console.error(
        "Backend response:",
        error.response?.data
      );

      setFeedback(
        "Unable to evaluate the answer. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // NEXT QUESTION
  // ==========================================

  const handleNext = async () => {
    stopMic();

    clearInterval(
      timerRef.current
    );

    setAnswer("");
    setFeedback("");

    if (
      currentIndex + 1 >=
      questions.length
    ) {
      await finishInterview();
      return;
    }

    await speakText(
      "Alright, let's move to the next question."
    );

    setCurrentIndex(
      (previousIndex) =>
        previousIndex + 1
    );
  };

  // ==========================================
  // FINISH INTERVIEW
  // ==========================================

  const finishInterview = async () => {
    stopMic();

    clearInterval(
      timerRef.current
    );

    setIsMicOn(false);

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    try {
      const result = await axios.post(
        ServerUrl +
          "/api/interview/finish",
        {
          interviewId,
        },
        {
          withCredentials: true,
        }
      );

      console.log(
        "✅ Interview finished:",
        result.data
      );

      onFinish(result.data);
    } catch (error) {
      console.error(
        "❌ Finish Interview Error:",
        error
      );

      console.error(
        "Backend response:",
        error.response?.data
      );
    }
  };

  // ==========================================
  // CLEANUP
  // ==========================================

  useEffect(() => {
    return () => {
      clearInterval(
        timerRef.current
      );

      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onresult = null;

          recognitionRef.current.stop();
          recognitionRef.current.abort();
        } catch (error) {
          console.log(
            "Microphone cleanup:",
            error.message
          );
        }
      }

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[1600px] min-h-[80vh] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col lg:flex-row overflow-hidden">

        {/* VIDEO SECTION */}

        <div className="w-full lg:w-[35%] bg-white flex flex-col items-center p-6 space-y-6 border-r border-gray-200">
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-xl">
            <video
              src={videoSource}
              key={videoSource}
              ref={videoRef}
              muted
              playsInline
              preload="auto"
              className="w-full h-auto object-cover"
            />
          </div>

          {/* SUBTITLE */}

          {subtitle && (
            <div className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-gray-700 text-sm sm:text-base font-medium text-center leading-relaxed">
                {subtitle}
              </p>
            </div>
          )}

          {/* TIMER */}

          <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-md p-6 space-y-5">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                Interview Status
              </span>

              {isAIPlaying && (
                <span className="text-sm font-semibold text-emerald-600">
                  AI Speaking
                </span>
              )}

              {!isAIPlaying &&
                isMicOn &&
                !isIntroPhase && (
                  <span className="text-sm font-semibold text-emerald-600">
                    Listening
                  </span>
                )}
            </div>

            <div className="h-px bg-gray-200" />

            <div className="flex justify-center">
              <div className="w-28 h-28">
                <Timer
                  timeLeft={timeLeft}
                  totalTime={
                    currentQuestion?.timeLimit ||
                    60
                  }
                />
              </div>
            </div>

            <div className="h-px bg-gray-200" />

            <div className="grid grid-cols-2 gap-6 text-center">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-emerald-600">
                  {currentIndex + 1}
                </span>

                <span className="text-xs text-gray-400">
                  Current Question
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-2xl font-bold text-emerald-600">
                  {questions.length}
                </span>

                <span className="text-xs text-gray-400">
                  Total Questions
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TEXT SECTION */}

        <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 relative">
          <h2 className="text-xl sm:text-2xl font-bold text-emerald-600 mb-6">
            AI Smart Interview
          </h2>

          {!isIntroPhase && (
            <div className="relative mb-6 bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-xs sm:text-sm text-gray-400 mb-2">
                Question {currentIndex + 1} of{" "}
                {questions.length}
              </p>

              <div className="text-base sm:text-lg font-semibold text-gray-800 leading-relaxed">
                {currentQuestion?.question}
              </div>
            </div>
          )}

          <textarea
            placeholder="Type your answer here..."
            onChange={(event) =>
              setAnswer(
                event.target.value
              )
            }
            value={answer}
            className="flex-1 min-h-[250px] bg-gray-100 p-4 sm:p-6 rounded-2xl resize-none outline-none border border-gray-200 focus:ring-2 focus:ring-emerald-500 transition text-gray-800"
          />

          {!feedback ? (
            <div className="flex items-center gap-4 mt-6">

              {/* MICROPHONE BUTTON */}

              <motion.button
                type="button"
                onClick={toggleMic}
                whileTap={{
                  scale: 0.9,
                }}
                disabled={
                  isAIPlaying ||
                  isIntroPhase ||
                  isSubmitting
                }
                title={
                  isMicOn
                    ? "Turn microphone off"
                    : "Turn microphone on"
                }
                className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full text-white shadow-lg transition ${
                  isMicOn
                    ? "bg-black hover:bg-gray-800"
                    : "bg-gray-400 hover:bg-gray-500"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isMicOn ? (
                  <FaMicrophone size={20} />
                ) : (
                  <FaMicrophoneSlash
                    size={20}
                  />
                )}
              </motion.button>

              {/* SUBMIT BUTTON */}

              <motion.button
                type="button"
                onClick={submitAnswer}
                disabled={
                  isSubmitting ||
                  isAIPlaying ||
                  isIntroPhase
                }
                whileTap={{
                  scale: 0.95,
                }}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-3 sm:py-4 rounded-2xl shadow-lg hover:opacity-90 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? "Submitting..."
                  : "Submit Answer"}
              </motion.button>
            </div>
          ) : (
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              className="mt-6 bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shadow-sm"
            >
              <p className="text-emerald-700 font-medium mb-4">
                {feedback}
              </p>

              <button
                type="button"
                onClick={handleNext}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-3 rounded-xl shadow-md hover:opacity-90 transition flex items-center justify-center gap-1"
              >
                {currentIndex + 1 >=
                questions.length
                  ? "Finish Interview"
                  : "Next Question"}

                <BsArrowRight size={18} />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Step2Interview;