// app.js
// AI Ethics Coach — Governance & Risk Trainer (client-side only)

(function () {
  const state = {
    tts: {
      synth: "speechSynthesis" in window ? window.speechSynthesis : null,
      supported:
        "speechSynthesis" in window &&
        typeof window.SpeechSynthesisUtterance !== "undefined",
      enabled: true,
      current: null,
    },
    currentTrackId: null,
    currentQuestion: null,
    notes: [],
  };

  // --- DOM HOOKS -------------------------------------------------------------

  const btnCoachIntro = document.getElementById("btn-coach-intro");
  const btnTtsToggle = document.getElementById("btn-tts-toggle");

  const trackSelect = document.getElementById("track-select");
  const btnStartTrack = document.getElementById("btn-start-track");
  const trackBrief = document.getElementById("track-brief");
  const sessionStatus = document.getElementById("session-status");

  const questionTitle = document.getElementById("question-title");
  const questionMeta = document.getElementById("question-meta");
  const questionTextEl = document.getElementById("question-text");
  const btnPlayQuestion = document.getElementById("btn-play-question");
  const btnNextQuestion = document.getElementById("btn-next-question");

  const answerInput = document.getElementById("answer-input");
  const btnSubmitAnswer = document.getElementById("btn-submit-answer");
  const btnClearAnswer = document.getElementById("btn-clear-answer");
  const coachFeedback = document.getElementById("coach-feedback");

  const notesList = document.getElementById("notes-list");
  const btnCopyNotes = document.getElementById("btn-copy-notes");

  // --- TRACK CONFIG ---------------------------------------------------------

  const TRACKS = {
    privacy: {
      label: "Privacy & PIAs",
      brief:
        "Pressure on data protection, consent, and how you use Privacy Impact Assessments before you unleash a system.",
      intro:
        "Privacy is not a checkbox. It is an ongoing contract between your system and the humans whose data you’re touching. In this track, I want to hear how you protect people before you impress them.",
      questions: [
        {
          id: "privacy-1",
          title: "PIA Under Pressure",
          prompt:
            "You’re deploying a new facial recognition feature in a high-traffic app. Walk me through how you would run a Privacy Impact Assessment. Name at least three concrete risks you’d look for, how you’d document them, and one risk that would force you to delay or cancel launch.",
          tags: ["privacy", "PIA", "facial recognition"],
          keys: ["privacy", "pia", "consent", "retention", "gdpr", "minimization"],
        },
        {
          id: "privacy-2",
          title: "Data Minimization Reality Check",
          prompt:
            "Your team argues that collecting extra user attributes is ‘nice to have’ for future analytics. Explain, in plain language, how you enforce data minimization. What data do you refuse to collect, and how do you defend that decision to growth-obsessed leadership?",
          tags: ["privacy", "data minimization"],
          keys: ["minimize", "minimization", "retention", "purpose", "consent"],
        },
        {
          id: "privacy-3",
          title: "Breach Scenario",
          prompt:
            "An internal tool accidentally exposed logs with partial customer identifiers to a contractor. Describe your immediate response, how you communicate with affected users, and what structural change you make so this never repeats.",
          tags: ["incident response", "privacy"],
          keys: ["notify", "notification", "incident", "contain", "regulator", "root cause"],
        },
      ],
    },
    bias: {
      label: "Bias & Fairness",
      brief:
        "Bias does not fix itself. This track pressures you on datasets, fairness-aware algorithms, and what you do when metrics expose harm.",
      intro:
        "If your system quietly harms one group more than another, it is not intelligent. It is lazy. In this track, I want to see if you treat fairness as math, governance, and responsibility — not vibes.",
      questions: [
        {
          id: "bias-1",
          title: "Fairness Toolkit in the Wild",
          prompt:
            "You discover performance gaps across demographic groups in your model. Describe, step by step, how you would use a fairness toolkit like AI Fairness 360 or equivalent to diagnose and mitigate these gaps. Be specific about metrics, trade-offs, and when you would pull the plug.",
          tags: ["fairness toolkit"],
          keys: ["fairness", "bias", "demographic", "mitigation", "metric", "trade-off"],
        },
        {
          id: "bias-2",
          title: "Dataset Autopsy",
          prompt:
            "Your training data reflects historical hiring decisions from a company with a poor DEI track record. Explain how you would audit, repair, or replace this dataset before training. What signals tell you that the data is too toxic to salvage?",
          tags: ["dataset", "historical bias"],
          keys: ["sampling", "representation", "historical", "reweigh", "balance", "discard"],
        },
        {
          id: "bias-3",
          title: "Stakeholder Pushback",
          prompt:
            "Leadership insists that addressing bias will ‘slow down innovation.’ How do you respond in a way that is technically grounded and ethically non-negotiable? Give them numbers, not slogans.",
          tags: ["stakeholders", "risk"],
          keys: ["risk", "regulatory", "reputation", "lawsuit", "trust", "compliance"],
        },
      ],
    },
    transparency: {
      label: "Transparency & Explainability",
      brief:
        "You’re pressured on LIME, interpretable models, and how you talk to non-technical humans about black-box systems.",
      intro:
        "Users do not owe your model blind trust. In this track, I want to know if you can open the black box without drowning people in math.",
      questions: [
        {
          id: "transparency-1",
          title: "Explainability vs. Accuracy",
          prompt:
            "In a high-stakes healthcare system, your most accurate model is also the least interpretable. Explain how you decide between a highly accurate black-box model and a slightly less accurate but interpretable one. What do you tell clinicians and patients?",
          tags: ["trade-offs", "healthcare"],
          keys: ["explainable", "accuracy", "trade-off", "risk", "stakeholder"],
        },
        {
          id: "transparency-2",
          title: "Using LIME Responsibly",
          prompt:
            "You apply LIME to explain an individual prediction that denies someone a loan. Describe how you would present the explanation to the applicant, and how you’d use what you learn to improve the system.",
          tags: ["LIME", "individual explanations"],
          keys: ["lime", "feature", "importance", "input", "reason"],
        },
        {
          id: "transparency-3",
          title: "Model Cards & Documentation",
          prompt:
            "Your organization has no culture of documenting models. Draft the outline of a ‘model card’ for a critical AI system, naming at least five sections that should always be present and who is accountable for keeping it updated.",
          tags: ["documentation"],
          keys: ["audience", "limitations", "dataset", "intended use", "owner", "update"],
        },
      ],
    },
    governance: {
      label: "Governance & Accountability",
      brief:
        "Here you’re tested on review boards, guardrails, and how you keep AI inside the lines when everyone wants to move fast.",
      intro:
        "Governance is not a slide deck. It is structure — who can do what, with which systems, and how often they are forced to answer for it.",
      questions: [
        {
          id: "governance-1",
          title: "Ethics Board in Practice",
          prompt:
            "Design an AI ethics review board for a mid-sized company. Who sits on it, what powers do they have, and when can they veto a launch? Be concrete about triggers and escalation paths.",
          tags: ["review board"],
          keys: ["board", "veto", "escalation", "cross-functional", "charter"],
        },
        {
          id: "governance-2",
          title: "Accountability Chain",
          prompt:
            "A harmful model decision reaches a real user. Map the chain of accountability from data collection to deployment. Who is responsible for what, and how do you prevent everyone from pointing fingers at ‘the algorithm’?",
          tags: ["accountability"],
          keys: ["owner", "responsible", "raci", "audit", "logging"],
        },
        {
          id: "governance-3",
          title: "Continuous Governance",
          prompt:
            "Your governance framework looks great on paper but hasn’t been updated in 18 months. Describe how you design governance as a living system: what gets monitored, how often, and how feedback loops actually change behavior.",
          tags: ["continuous governance"],
          keys: ["monitor", "feedback", "review", "update", "audit", "iteration"],
        },
      ],
    },
    compas: {
      label: "Case Study — COMPAS Failure",
      brief:
        "This track drills your ability to learn from a real-world failure around bias, opacity, and public trust.",
      intro:
        "The COMPAS case is a reminder: when bias hides inside a closed box, real humans pay the bill. I want to hear if you treat case studies as trivia — or as warnings.",
      questions: [
        {
          id: "compas-1",
          title: "Diagnosing the Failure",
          prompt:
            "Summarize, in your own words, what went ethically wrong with the COMPAS recidivism system. Focus on bias, transparency, and accountability. Then name one design decision you would absolutely not repeat in any system you touch.",
          tags: ["COMPAS", "case study"],
          keys: ["bias", "transparent", "transparency", "black box", "appeal", "oversight"],
        },
        {
          id: "compas-2",
          title: "Designing the Counter-Example",
          prompt:
            "Imagine you are asked to design a replacement for COMPAS. Describe three guardrails you would implement around data, model choice, and human oversight to avoid repeating the same harm.",
          tags: ["redesign"],
          keys: ["fairness", "appeals", "human in the loop", "explainable", "audit"],
        },
        {
          id: "compas-3",
          title: "Public Trust & Communication",
          prompt:
            "The public learns that an AI system is influencing sentencing decisions. Draft the core message you would share with the community to explain how the system works, how it is governed, and how people can challenge decisions they believe are unfair.",
          tags: ["public trust"],
          keys: ["trust", "challenge", "appeal", "oversight", "community"],
        },
      ],
    },
  };

  // --- HELPERS --------------------------------------------------------------

  function speak(text) {
    if (!state.tts.supported || !state.tts.enabled || !text) return;

    try {
      if (state.tts.current) {
        state.tts.current.onend = null;
      }
      state.tts.synth.cancel();
    } catch (_) {
      // ignore
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    state.tts.current = utterance;

    try {
      state.tts.synth.speak(utterance);
    } catch (_) {
      // Safari sometimes throws if voices not ready; fail silently.
    }
  }

  function randomFrom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  function updateSessionStatus(text) {
    sessionStatus.textContent = text;
  }

  function setQuestion(trackId, q) {
    state.currentTrackId = trackId;
    state.currentQuestion = q;

    questionTitle.textContent = q.title;
    questionMeta.textContent =
      TRACKS[trackId].label + " · Question ID: " + q.id.toUpperCase();
    questionTextEl.textContent = q.prompt;

    btnPlayQuestion.disabled = false;
    btnNextQuestion.disabled = false;
  }

  function renderNotes() {
    if (!state.notes.length) {
      notesList.innerHTML =
        '<li class="ae-muted small">No notes yet. Answer a question to start building your ethics trail.</li>';
      return;
    }

    const items = state.notes
      .slice()
      .reverse()
      .map(
        (n) =>
          `<li><span class="tag">${n.trackLabel}</span><strong>${n.questionTitle}</strong><br>${n.summary}</li>`
      )
      .join("");
    notesList.innerHTML = items;
  }

  function summarizeAnswer(answer) {
    if (!answer) return "No answer recorded.";
    const trimmed = answer.trim();
    if (trimmed.length <= 140) return trimmed;
    return trimmed.slice(0, 137) + "...";
  }

  function evaluateAnswer(trackId, question, answer) {
    const trimmed = (answer || "").trim();
    if (!trimmed) {
      return {
        tone: "weak",
        text:
          "You submitted a blank answer. In a real governance review that looks like avoidance, not humility.",
      };
    }

    if (trimmed.length < 80) {
      return {
        tone: "weak",
        text:
          "This is tweet-length, not boardroom-length. Expand with concrete mechanisms, not slogans.",
      };
    }

    const lower = trimmed.toLowerCase();
    let hitCount = 0;
    (question.keys || []).forEach((k) => {
      if (lower.includes(k)) hitCount += 1;
    });

    const density = question.keys && question.keys.length
      ? hitCount / question.keys.length
      : 0;

    if (density >= 0.6) {
      return {
        tone: "solid",
        text:
          "You’re hitting the right levers — you mentioned core ethics signals for this scenario. Now tighten it by naming explicit owners, thresholds, and what gets logged when things go wrong.",
      };
    }

    if (density >= 0.3) {
      return {
        tone: "medium",
        text:
          "You’re in the neighborhood, but still vague. You touch some of the right concepts, yet I need clearer controls: who is accountable, what metrics you track, and how people can challenge the system.",
      };
    }

    return {
      tone: "weak",
      text:
        "You’re describing intentions more than structures. Talk less about ‘importance’ and more about concrete tools, checks, and escalation paths you would implement.",
    };
  }

  // --- EVENT HANDLERS -------------------------------------------------------

  btnCoachIntro.addEventListener("click", function () {
    const intro =
      "I am the AI Ethics Coach for Flame Division Academy. " +
      "I’m not here to scare you — I’m here to keep your systems from quietly harming people. " +
      "Answer like you’re in front of an ethics board that actually has veto power. No buzzword clouds, no ‘move fast and break things’.";
    coachFeedback.textContent =
      "Coach: Listening. Pick a track and start your first drill.";
    coachFeedback.classList.remove("feedback-weak", "feedback-solid");
    speak(intro);
  });

  btnTtsToggle.addEventListener("click", function () {
    state.tts.enabled = !state.tts.enabled;
    btnTtsToggle.textContent = state.tts.enabled ? "🔊 TTS: ON" : "🔇 TTS: OFF";
    btnTtsToggle.classList.toggle("ghost");
    if (!state.tts.enabled && state.tts.synth) {
      try {
        state.tts.synth.cancel();
      } catch (_) {}
    }
  });

  btnStartTrack.addEventListener("click", function () {
    const id = trackSelect.value;
    if (!id || !TRACKS[id]) {
      trackBrief.textContent = "Choose a track first. Ethics without focus is just noise.";
      trackBrief.classList.add("ae-muted");
      return;
    }

    const track = TRACKS[id];
    trackBrief.textContent = track.brief;
    updateSessionStatus("SESSION: " + track.label + " — live.");

    const q = randomFrom(track.questions);
    setQuestion(id, q);

    coachFeedback.textContent =
      "Coach: Track loaded. Read the question, then answer like this decision will show up in an audit later.";
    coachFeedback.classList.remove("feedback-weak", "feedback-solid");

    speak(track.intro + " Here is your first question. " + q.prompt);
  });

  btnPlayQuestion.addEventListener("click", function () {
    if (!state.currentQuestion) return;
    speak(state.currentQuestion.prompt);
  });

  btnNextQuestion.addEventListener("click", function () {
    if (!state.currentTrackId) return;
    const track = TRACKS[state.currentTrackId];
    const next = randomFrom(track.questions);
    setQuestion(state.currentTrackId, next);
    answerInput.value = "";
    coachFeedback.textContent =
      "Coach: New angle, same pressure. Answer this one from the ground up, not by reusing your last answer.";
    coachFeedback.classList.remove("feedback-weak", "feedback-solid");
    speak(next.prompt);
  });

  btnClearAnswer.addEventListener("click", function () {
    answerInput.value = "";
    coachFeedback.textContent =
      "Answer cleared. Breathe. Then write what you would actually stand behind in the field.";
    coachFeedback.classList.remove("feedback-weak", "feedback-solid");
  });

  btnSubmitAnswer.addEventListener("click", function () {
    if (!state.currentTrackId || !state.currentQuestion) {
      coachFeedback.textContent =
        "Pick a track and load a question first. Ethics without a concrete scenario is just philosophy.";
      coachFeedback.classList.add("feedback-weak");
      return;
    }

    const answer = answerInput.value;
    const result = evaluateAnswer(
      state.currentTrackId,
      state.currentQuestion,
      answer
    );

    coachFeedback.textContent = "Coach: " + result.text;
    coachFeedback.classList.remove("feedback-weak", "feedback-solid");

    if (result.tone === "weak") {
      coachFeedback.classList.add("feedback-weak");
    } else if (result.tone === "solid") {
      coachFeedback.classList.add("feedback-solid");
    }

    speak(result.text);

    // update notes
    state.notes.push({
      trackLabel: TRACKS[state.currentTrackId].label,
      questionTitle: state.currentQuestion.title,
      summary: summarizeAnswer(answer),
    });
    if (state.notes.length > 12) state.notes.shift();
    renderNotes();
  });

  btnCopyNotes.addEventListener("click", function () {
    if (!state.notes.length) {
      coachFeedback.textContent =
        "No notes to copy yet. Answer at least one question first.";
      coachFeedback.classList.add("feedback-weak");
      return;
    }

    const text = state.notes
      .map(
        (n, idx) =>
          `#${idx + 1} [${n.trackLabel}] ${n.questionTitle}\n${n.summary}\n`
      )
      .join("\n");

    navigator.clipboard
      .writeText(text)
      .then(() => {
        coachFeedback.textContent =
          "Coach: Notes copied. Paste them into your journal, syllabus reflection, or governance doc.";
        coachFeedback.classList.remove("feedback-weak");
      })
      .catch(() => {
        coachFeedback.textContent =
          "Clipboard blocked. Select the notes manually if you want to save them.";
        coachFeedback.classList.add("feedback-weak");
      });
  });

  // Initial TTS status if unsupported
  if (!state.tts.supported) {
    btnTtsToggle.textContent = "🔇 TTS not available";
    btnTtsToggle.disabled = true;
    btnCoachIntro.disabled = true;
  }

  renderNotes();
})();
