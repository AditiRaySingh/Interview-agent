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

  const [isMicOn, setIsMicOn] = useState(false);

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

  const [speechSupported, setSpeechSupported] =
    useState(true);

  const [micError, setMicError] = useState("");

  const currentQuestion = questions[currentIndex];

  const [timeLeft, setTimeLeft] = useState(
    currentQuestion?.timeLimit || 60
  );

  // =====================================================
  // REFS
  // =====================================================

  const recognitionRef = useRef(null);

  const videoRef = useRef(null);

  const timerRef = useRef(null);

  const shouldListenRef = useRef(false);

  const isRecognitionRunningRef = useRef(false);

  // =====================================================
  // LOAD SPEECH VOICES
  // =====================================================

  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      console.warn("Speech synthesis not supported.");
      return;
    }

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();

      if (!voices.length) return;

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

  // =====================================================
  // VIDEO
  // =====================================================

  const videoSource =
    voiceGender === "male"
      ? maleVideo
      : femaleVideo;

  // =====================================================
  // SPEAK TEXT
  // =====================================================

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

      const utterance =
        new SpeechSynthesisUtterance(text);

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
            .catch(() => {});
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

      utterance.onerror = () => {
        setIsAIPlaying(false);

        setSubtitle("");

        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  };

  // =====================================================
  // CREATE SPEECH RECOGNITION
  // IMPORTANT: ONLY CREATE ONCE
  // =====================================================

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);

      setMicError(
        "Speech recognition is not supported. Please use Google Chrome."
      );

      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";

    recognition.continuous = true;

    recognition.interimResults = true;

    recognition.maxAlternatives = 1;

    // ===================================================
    // START
    // ===================================================

    recognition.onstart = () => {
      console.log("🎤 Speech recognition STARTED");

      isRecognitionRunningRef.current = true;

      setMicError("");
    };

    // ===================================================
    // RESULT
    // ===================================================

    recognition.onresult = (event) => {
      console.log("🎤 Speech result received");

      let transcript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        transcript +=
          event.results[i][0].transcript;
      }

      transcript = transcript.trim();

      console.log("🎤 Transcript:", transcript);

      if (!transcript) return;

      /*
        We replace the textarea with the latest
        recognized text while speaking.
      */

      setAnswer((previous) => {
        const lastResult =
          event.results[event.resultIndex];

        if (lastResult?.isFinal) {
          if (!previous.trim()) {
            return transcript;
          }

          return `${previous.trim()} ${transcript}`;
        }

        return previous;
      });
    };

    // ===================================================
    // ERROR
    // ===================================================

    recognition.onerror = (event) => {
      console.error(
        "🎤 Speech Recognition Error:",
        event.error
      );

      isRecognitionRunningRef.current = false;

      if (event.error === "not-allowed") {
        setIsMicOn(false);

        shouldListenRef.current = false;

        setMicError(
          "Microphone permission denied. Allow microphone access in Chrome."
        );
      }

      if (event.error === "audio-capture") {
        setIsMicOn(false);

        shouldListenRef.current = false;

        setMicError(
          "No microphone detected. Check your microphone."
        );
      }

      if (event.error === "network") {
        setMicError(
          "Speech recognition network error."
        );
      }
    };

    // ===================================================
    // END
    // ===================================================

    recognition.onend = () => {
      console.log("🎤 Speech recognition ENDED");

      isRecognitionRunningRef.current = false;

      /*
        Chrome sometimes automatically stops recognition.
        Restart it if we still want to listen.
      */

      if (
        shouldListenRef.current &&
        !isAIPlaying &&
        !isSubmitting &&
        !feedback &&
        !isIntroPhase
      ) {
        setTimeout(() => {
          try {
            if (
              shouldListenRef.current &&
              !isRecognitionRunningRef.current
            ) {
              recognition.start();

              console.log(
                "🎤 Recognition restarted"
              );
            }
          } catch (error) {
            console.log(
              "Recognition restart:",
              error.message
            );
          }
        }, 300);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;

      try {
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;

        recognition.stop();
      } catch (error) {
        console.log(
          "Recognition cleanup:",
          error.message
        );
      }

      recognitionRef.current = null;
    };
  }, []);

  // =====================================================
  // START MIC
  // =====================================================

  const startMic = () => {
    if (!speechSupported) {
      alert(
        "Speech recognition is not supported. Please use Google Chrome."
      );

      return;
    }

    const recognition =
      recognitionRef.current;

    if (!recognition) {
      console.error(
        "❌ Recognition object not available"
      );

      return;
    }

    if (isAIPlaying) {
      console.log(
        "AI is speaking. Microphone will not start."
      );

      return;
    }

    if (isSubmitting) return;

    if (isIntroPhase) return;

    if (feedback) return;

    shouldListenRef.current = true;

    setIsMicOn(true);

    setMicError("");

    if (isRecognitionRunningRef.current) {
      console.log(
        "🎤 Recognition already running"
      );

      return;
    }

    try {
      recognition.start();

      console.log(
        "🎤 Starting speech recognition..."
      );
    } catch (error) {
      console.log(
        "🎤 Start recognition:",
        error.message
      );
    }
  };

  // =====================================================
  // STOP MIC
  // =====================================================

  const stopMic = () => {
    shouldListenRef.current = false;

    const recognition =
      recognitionRef.current;

    if (!recognition) return;

    try {
      recognition.stop();

      isRecognitionRunningRef.current = false;

      console.log(
        "🎤 Speech recognition stopped"
      );
    } catch (error) {
      console.log(
        "Stop microphone:",
        error.message
      );
    }
  };

  // =====================================================
  // TOGGLE MIC
  // =====================================================

  const toggleMic = () => {
    if (isMicOn) {
      stopMic();

      setIsMicOn(false);

      return;
    }

    startMic();
  };

  // =====================================================
  // INTRO + QUESTION SPEECH
  // =====================================================

  useEffect(() => {
    if (!selectedVoice) return;

    let cancelled = false;

    const runInterviewSpeech = async () => {
      try {
        if (isIntroPhase) {
          await speakText(
            `Hi ${userName}, it's great to meet you today. I hope you're feeling confident and ready.`
          );

          if (cancelled) return;

          await speakText(
            "I'll ask you a few questions. Just answer naturally, and take your time. Let's begin."
          );

          if (cancelled) return;

          setIsIntroPhase(false);

          return;
        }

        if (!currentQuestion) return;

        await new Promise((resolve) =>
          setTimeout(resolve, 500)
        );

        if (cancelled) return;

        setIsQuestionSpeaking(true);

        await speakText(
          currentQuestion.question
        );

        if (cancelled) return;

        setIsQuestionSpeaking(false);

        setTimeLeft(
          currentQuestion.timeLimit || 60
        );

        /*
          Automatically start microphone after
          AI finishes speaking.
        */

        setTimeout(() => {
          if (
            !cancelled &&
            !isSubmitting &&
            !feedback
          ) {
            startMic();
          }
        }, 500);
      } catch (error) {
        console.error(
          "Interview speech error:",
          error
        );

        setIsQuestionSpeaking(false);

        if (isIntroPhase) {
          setIsIntroPhase(false);
        }
      }
    };

    runInterviewSpeech();

    return () => {
      cancelled = true;
    };
  }, [
    selectedVoice,
    isIntroPhase,
    currentIndex,
  ]);

  // =====================================================
  // TIMER
  // =====================================================

  useEffect(() => {
    if (isIntroPhase) return;

    if (!currentQuestion) return;

    if (isQuestionSpeaking) return;

    if (feedback) return;

    if (isSubmitting) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((previousTime) => {
        if (previousTime <= 1) {
          clearInterval(timerRef.current);

          return 0;
        }

        return previousTime - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
    };
  }, [
    isIntroPhase,
    currentIndex,
    isQuestionSpeaking,
    feedback,
    isSubmitting,
  ]);

  // =====================================================
  // RESET TIMER
  // =====================================================

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

  // =====================================================
  // AUTO SUBMIT
  // =====================================================

  useEffect(() => {
    if (isIntroPhase) return;

    if (!currentQuestion) return;

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

  // =====================================================
  // SUBMIT ANSWER
  // =====================================================

  const submitAnswer = async () => {
    if (isSubmitting) return;

    if (!answer.trim()) {
      setFeedback(
        "Please provide an answer before continuing."
      );

      return;
    }

    stopMic();

    clearInterval(timerRef.current);

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
            (currentQuestion?.timeLimit || 60) -
            timeLeft,
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
        "Submit Answer Error:",
        error
      );

      console.error(
        "Backend:",
        error.response?.data
      );

      setFeedback(
        "Unable to evaluate the answer. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // =====================================================
  // NEXT QUESTION
  // =====================================================

  const handleNext = async () => {
    stopMic();

    clearInterval(timerRef.current);

    setAnswer("");

    setFeedback("");

    setMicError("");

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

  // =====================================================
  // FINISH INTERVIEW
  // =====================================================

  const finishInterview = async () => {
    stopMic();

    clearInterval(timerRef.current);

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
        "Interview finished:",
        result.data
      );

      onFinish(result.data);
    } catch (error) {
      console.error(
        "Finish Interview Error:",
        error
      );
    }
  };

  // =====================================================
  // CLEANUP
  // =====================================================

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);

      shouldListenRef.current = false;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 flex items-center justify-center p-4 sm:p-6">

      <div className="w-full max-w-[1600px] min-h-[80vh] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col lg:flex-row overflow-hidden">

        {/* VIDEO */}

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

          {subtitle && (
            <div className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">

              <p className="text-gray-700 text-sm sm:text-base font-medium text-center leading-relaxed">
                {subtitle}
              </p>

            </div>
          )}

          <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-md p-6 space-y-5">

            <div className="flex justify-between items-center">

              <span className="text-sm text-gray-500">
                Interview Status
              </span>

              {isAIPlaying && (
                <span className="text-sm font-semibold text-blue-600">
                  AI Speaking
                </span>
              )}

              {!isAIPlaying &&
                isMicOn &&
                !isIntroPhase && (
                  <span className="text-sm font-semibold text-emerald-600">
                    🎤 Listening
                  </span>
                )}

              {!isAIPlaying &&
                !isMicOn &&
                !isIntroPhase && (
                  <span className="text-sm font-semibold text-gray-400">
                    Microphone Off
                  </span>
                )}

            </div>

            {micError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
                {micError}
              </div>
            )}

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

        {/* RIGHT SIDE */}

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

          {/* ANSWER */}

          <textarea
            placeholder={
              isMicOn
                ? "Speak your answer... your speech will appear here automatically."
                : "Click the microphone and start speaking..."
            }
            onChange={(event) =>
              setAnswer(event.target.value)
            }
            value={answer}
            className="flex-1 min-h-[250px] bg-gray-100 p-4 sm:p-6 rounded-2xl resize-none outline-none border border-gray-200 focus:ring-2 focus:ring-emerald-500 transition text-gray-800"
          />

          {!feedback ? (
            <div className="flex items-center gap-4 mt-6">

              {/* MIC */}

              <motion.button
                type="button"
                onClick={toggleMic}
                whileTap={{ scale: 0.9 }}
                disabled={
                  isAIPlaying ||
                  isIntroPhase ||
                  isSubmitting
                }
                className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full text-white shadow-lg transition ${
                  isMicOn
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-black hover:bg-gray-800"
                } disabled:opacity-50`}
              >

                {isMicOn ? (
                  <FaMicrophone size={20} />
                ) : (
                  <FaMicrophoneSlash
                    size={20}
                  />
                )}

              </motion.button>

              {/* SUBMIT */}

              <motion.button
                type="button"
                onClick={submitAnswer}
                disabled={
                  isSubmitting ||
                  isAIPlaying ||
                  isIntroPhase
                }
                whileTap={{ scale: 0.95 }}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-3 sm:py-4 rounded-2xl shadow-lg hover:opacity-90 transition font-semibold disabled:opacity-50"
              >

                {isSubmitting
                  ? "Submitting..."
                  : "Submit Answer"}

              </motion.button>

            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
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