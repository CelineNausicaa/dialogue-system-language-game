import { MachineConfig, send, Action, assign } from "xstate"; 


function say(text: string): Action<SDSContext, SDSEvent> {
  return send((_context: SDSContext) => ({ type: "SPEAK", value: text }));
}

interface Grammar {
  [index: string]: {
    intent: string;
    entities: {
      [index: string]: string;
    };
  };
}

const grammar: Grammar = {
  "hjälp": {
    intent: "None",
    entities: { help: "help"},
  },
  "fuska": {
    intent: "None",
    entities: { cheat: "cheat"},
  },
  "skippa": {
    intent: "None",
    entities: { skip: "skip"},
  },
  "instrument": {
    intent: "None",
    entities: { instrument: "instrument"},
  },
  "djur": {
    intent: "None",
    entities: { animals: "animals"},
  },
  "resa": {
    intent: "None",
    entities: { travel: "travel"},
  },
  "nej": {
    intent: "None",
    entities: { denial: "no"},
  },
  "nah": {
    intent: "None",
    entities: { denial: "no"},
  },
  "det tror jag inte": {
    intent: "None",
    entities: { denial: "no"},
  },
  "nej nej": {
    intent: "None",
    entities: { denial: "no"},
  },
  "ja": {
    intent: "None",
    entities: { confirmation:"yes"},
  },
  "jo": {
    intent: "None",
    entities: { confirmation:"yes"},
  },
  "javisst": {
    intent: "None",
    entities: { confirmation:"yes"},
  },
  "jaa": {
    intent: "None",
    entities: { confirmation:"yes"},
  },
  "ja, tack": {
    intent: "None",
    entities: { confirmation:"yes"},
  },
};

const getEntity = (context: SDSContext, entity: string) => {
  // lowercase the utterance and remove tailing "."
  let u = context.recResult[0].utterance.toLowerCase().replace(/\.$/g, "");
  if (u in grammar) {
    if (entity in grammar[u].entities) {
      return grammar[u].entities[entity];
    }
  }
  return false;
};

function insertImage(langImage: any) {
  const img = document.getElementById("image");
  const myImage = img.innerHTML = `<div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-image: url('/img/${langImage}.jpg'); background-size: contain; background-repeat: no-repeat; background-position: center; width: 70%; height: 70%;">
    <img src="/img/${langImage}.jpg" style="opacity: 0;"/>
  </div>`;
    return myImage;
};

function insertTranslation(transl:any) {
  const clue = document.getElementById("translation");
  clue.innerHTML = transl;
  clue.style.position = "fixed";
  clue.style.top = "10%";
  clue.style.left = "50%";
  clue.style.transform = "translate(-50%, -50%)";
  clue.style.fontSize = "24px";
  clue.style.textAlign = "center";
  return clue;
}


export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = {
  initial: "idle",
  states: {
    idle: {
      on: {
        CLICK: "init",
      },
    },
    init: {
      on: {
        TTS_READY: "welcome",
        CLICK: "welcome",
      },
    },
    welcome: {
      entry:[assign({count: 0})],
      initial: "prompt",
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },
          {
            target: "startInstruments",
            cond: (context) => !!getEntity(context, "instrument"),
          },
          {
            target: "startAnimals",
            cond: (context) => !!getEntity(context, "animals"),
          },
          {
            target: "startTravel",
            cond: (context) => !!getEntity(context, "travel"),
          },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },
          {
            target: "startAnimals",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="pickTopic" && context.nluResult.prediction.entities[0].category==="topicAnimals" && context.recResult[0].confidence >= 0.6,

          },
          {
            target: "confirmStartAnimals",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="pickTopic" && context.nluResult.prediction.entities[0].category==="topicAnimals" && context.recResult[0].confidence < 0.6,

          },
          {
            target: "startInstruments",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="pickTopic" && context.nluResult.prediction.entities[0].category==="topicInstruments" && context.recResult[0].confidence >= 0.6,
          },
          {
            target: "confirmStartInstruments",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="pickTopic" && context.nluResult.prediction.entities[0].category==="topicInstruments" && context.recResult[0].confidence < 0.6,
          },
          {
            target: "startTravel",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="pickTopic" && context.nluResult.prediction.entities[0].category==="topicTravel" && context.recResult[0].confidence >= 0.6,
          },
          {
            target: "confirmStartTravel",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="pickTopic" && context.nluResult.prediction.entities[0].category==="topicTravel" && context.recResult[0].confidence < 0.6,
          },

          {
            target: ".nomatch",
          },

        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "Jag kan inte höra dig.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })],
              initial: "prompt",
              states: {
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: `Hej hej och välkomna till detta språkspel! 
                    Spelets mål är att lära dig nya svenska ord. Du måste bara berätta för mig vad du ser på bilderna. Men var försiktig: du har bara tre försök. Om du behöver lite hjälp, kan du bara säga hjälp. Du kan också skippa en bild om du säger skippa. Du kan också få en fusklapp, om du säger fuska. Är du redo? Först ska du välja ett ämne: djur, instrument, eller resa. ${insertImage("welcome")}` 
                    //Hello there! Welcome to this language game. The goal is simple: tell me what you see on the images, for now just in English. You have three attempts to get it right. You can ask for help at any time by saying help, skip an image by saying skip, or have a look a a cheat sheet by saying cheat. Are you ready? First, let's pick a topic: animals, instruments, or travel. ${insertImage("welcome")},
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Först ska du välja ett ämne: djur, instrument, eller resa.",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Först ska du välja ett ämne: djur, instrument, eller resa.",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "Jag ska hjälpa dig. Jag vill veta vilket ämne du vill ha: djur, instrument, eller resa."
          ),
          on: { ENDSPEECH: "#root.dm.welcome" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Förlåt, jag förstod inte. Vi ska prova igen.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    //actions: insertTranslation("English translation: giraffe"),

    confirmStartAnimals: {
      entry:[assign({count: 0})],
      initial: "prompt",
      on: {
        RECOGNISED: [
          {
            target: "startAnimals",
            cond: (context) => !!getEntity(context, "confirmation"),
            actions: assign({
              confirmation: (context) => getEntity(context, "confirmation"),
            }),
          },
          {
            target: "welcome",
            cond: (context) => !!getEntity(context, "denial"),
            actions: assign({
              denial: (context) => getEntity(context, "denial"),
            }),
          },

          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },

          {
            target: ".nomatch",
          },

        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "Jag kan inte höra dig.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })],
              initial: "prompt",
              states: {
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Du valde kategorin djur, bekräfta?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Du valde kategorin djur, bekräfta?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Du valde kategorin djur, bekräfta?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "Jag ska hjälpa dig. Kan du bekräfta att du vill ha kategorin djur?"
          ),
          on: { ENDSPEECH: "#root.dm.confirmStartAnimals" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Förlåt, jag förstod inte. Vi ska prova igen.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    startAnimals: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },
          {
            target: ".skip",
            cond: (context) => !!getEntity(context, "skip"),
          },
          {
            target: "cheat",
            cond: (context) => !!getEntity(context, "cheat"),
          },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },
          {
            target: "animals1",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="detArX" && context.nluResult.prediction.entities[0].text.toLowerCase() ==="giraff",
            actions: assign({
              points: (context) => 1,
            }),
          },
          {
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "Jag kan inte höra dig.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })], 
              initial: "prompt",
              states: {
                prompt: {
                  entry: [send((context) => ({
                    type: "SPEAK",
                    value:`Hur heter detta djur? ${insertImage("giraffe")}`,
                  })),
                  send((context) => ({
                    type: "SHOW_TRANSLATION",
                    value: insertTranslation("English translation: a giraffe"),
                  }))],
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Hur heter detta djur?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Hur heter detta djur?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "Jag ska hjälpa dig. Den första bokstaven är G."
          ),
          on: { ENDSPEECH: "#root.dm.startAnimals" },
        },
        skip: {
          entry: say(
            "Låt oss hoppa över denna bild."
          ),
          on: { ENDSPEECH: "#root.dm.animals1" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Tyvärr, det är fel. Du kan prova igen.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    cheat: {
      entry: send((context) => ({
        type: "SPEAK",
        value: "Jag ska visa dig fusklappen. Du har tio sekunder på dig att titta på den." + insertImage("cheat"),
      })),
      on: { ENDSPEECH: "delayTransition" },
    },

    delayTransition: {
      entry: send(`ENDSPEECH`,{delay:10000}),
      on: {ENDSPEECH: '#root.dm.startAnimals'}
    },

    animals1: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },
          {
            target: ".skip",
            cond: (context) => !!getEntity(context, "skip"),
          },
          {
            target: "cheat1",
            cond: (context) => !!getEntity(context, "cheat"),
          },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },
          {
            target: "animals2",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="detArX" && context.nluResult.prediction.entities[0].text.toLowerCase() ==="björn",
            actions: assign({
              points: (context) => 2,
            }),
          },
          {
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "Jag kan inte höra dig.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })],
              initial: "prompt",
              states: {
                prompt: {
                  entry: [send((context) => ({
                    type: "SPEAK",
                    value:`Hur heter detta djur? ${insertImage("bear")}`,
                  })),
                  send((context) => ({
                    type: "SHOW_TRANSLATION",
                    value: insertTranslation("English translation: a bear"),
                  }))],
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Hur heter detta djur?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Hur heter detta djur?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "Jag ska hjälpa dig. Den första bokstaven är B."
          ),
          on: { ENDSPEECH: "#root.dm.animals1" },
        },
        skip: {
          entry: say(
            "Låt oss hoppa över denna bild."
          ),
          on: { ENDSPEECH: "#root.dm.animals2" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Tyvärr, det är fel. Du kan prova igen.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    cheat1: {
      entry: send((context) => ({
        type: "SPEAK",
        value: "Jag ska visa dig fusklappen. Du har tio sekunder på dig att titta på den." + insertImage("cheat"),
      })),
      on: { ENDSPEECH: "delayTransition1" },
    },

    delayTransition1: {
      entry: send(`ENDSPEECH`,{delay:10000}),
      on: {ENDSPEECH: '#root.dm.animals1'}
    },

    animals2: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },
          {
            target: ".skip",
            cond: (context) => !!getEntity(context, "skip"),
          },
          {
            target: "cheat2",
            cond: (context) => !!getEntity(context, "cheat"),
          },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },
          {
            target: "animals3",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="detArX" && context.nluResult.prediction.entities[0].text.toLowerCase() ==="katt",
            actions: assign({
              points: (context) => 3,
            }),
          },
          {
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "Jag kan inte höra dig.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })],
              initial: "prompt",
              states: {
                prompt: {
                  entry: [send((context) => ({
                    type: "SPEAK",
                    value:`Hur heter detta djur? ${insertImage("cat")}`,
                  })),
                  send((context) => ({
                    type: "SHOW_TRANSLATION",
                    value: insertTranslation("English translation: a cat"),
                  }))],
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Hur heter detta djur?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Hur heter detta djur?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "Jag ska hjälpa dig. Den första bokstaven är K."
          ),
          on: { ENDSPEECH: "#root.dm.animals2" },
        },
        skip: {
          entry: say(
            "Låt oss hoppa över denna bild."
          ),
          on: { ENDSPEECH: "#root.dm.animals3" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Tyvärr, det är fel. Du kan prova igen.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    cheat2: {
      entry: send((context) => ({
        type: "SPEAK",
        value: "Jag ska visa dig fusklappen. Du har tio sekunder på dig att titta på den." + insertImage("cheat"),
      })),
      on: { ENDSPEECH: "delayTransition2" },
    },

    delayTransition2: {
      entry: send(`ENDSPEECH`,{delay:10000}),
      on: {ENDSPEECH: '#root.dm.animals2'}
    },

    animals3: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },
          {
            target: ".skip",
            cond: (context) => !!getEntity(context, "skip"),
          },
          {
            target: "cheat3",
            cond: (context) => !!getEntity(context, "cheat"),
          },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },
          {
            target: "animals4",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="detArX" && context.nluResult.prediction.entities[0].text.toLowerCase() ==="ren",
            actions: assign({
              points: (context) => 4,
            }),
          },
          {
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "Jag kan inte höra dig.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })],
              initial: "prompt",
              states: {
                prompt: {
                  entry: [send((context) => ({
                    type: "SPEAK",
                    value:`Hur heter detta djur? ${insertImage("deer")}`,
                  })),
                  send((context) => ({
                    type: "SHOW_TRANSLATION",
                    value: insertTranslation("English translation: a reindeer"),
                  }))],
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Hur heter detta djur?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Hur heter detta djur?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "Jag ska hjälpa dig. Den första bokstaven är R."
          ),
          on: { ENDSPEECH: "#root.dm.animals3" },
        },
        skip: {
          entry: say(
            "Låt oss hoppa över denna bild."
          ),
          on: { ENDSPEECH: "#root.dm.animals4" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Tyvärr, det är fel. Du kan prova igen.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    cheat3: {
      entry: send((context) => ({
        type: "SPEAK",
        value: "Jag ska visa dig fusklappen. Du har tio sekunder på dig att titta på den." + insertImage("cheat"),
      })),
      on: { ENDSPEECH: "delayTransition3" },
    },

    delayTransition3: {
      entry: send(`ENDSPEECH`,{delay:10000}),
      on: {ENDSPEECH: '#root.dm.animals3'}
    },

    animals4: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },
          {
            target: ".skip",
            cond: (context) => !!getEntity(context, "skip"),
          },
          {
            target: "cheat4",
            cond: (context) => !!getEntity(context, "cheat"),
          },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },
          {
            target: "animals5",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="detArX" && context.nluResult.prediction.entities[0].text.toLowerCase() ==="hund",
            actions: assign({
              points: (context) => 5,
            }),
          },
          {
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "Jag kan inte höra dig.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })],
              initial: "prompt",
              states: {
                prompt: {
                  entry: [send((context) => ({
                    type: "SPEAK",
                    value:`Hur heter detta djur? ${insertImage("dog")}`,
                  })),
                  send((context) => ({
                    type: "SHOW_TRANSLATION",
                    value: insertTranslation("English translation: a dog"),
                  }))],
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Hur heter detta djur?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Hur heter detta djur?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "Jag ska hjälpa dig. Den första bokstaven är H."
          ),
          on: { ENDSPEECH: "#root.dm.animals4" },
        },
        skip: {
          entry: say(
            "Låt oss hoppa över denna bild."
          ),
          on: { ENDSPEECH: "#root.dm.animals5" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Tyvärr, det är fel. Du kan prova igen.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    cheat4: {
      entry: send((context) => ({
        type: "SPEAK",
        value: "Jag ska visa dig fusklappen. Du har tio sekunder på dig att titta på den." + insertImage("cheat"),
      })),
      on: { ENDSPEECH: "delayTransition4" },
    },

    delayTransition4: {
      entry: send(`ENDSPEECH`,{delay:10000}),
      on: {ENDSPEECH: '#root.dm.animals4'}
    },

    animals5: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },
          {
            target: ".skip",
            cond: (context) => !!getEntity(context, "skip"),
          },
          {
            target: "cheat5",
            cond: (context) => !!getEntity(context, "cheat"),
          },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },
          {
            target: "info",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="detArX" && context.nluResult.prediction.entities[0].text.toLowerCase() ==="örn",
            actions: assign({
              points: (context) => 6,
            }),
          },
          {
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "Jag kan inte höra dig.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })],
              initial: "prompt",
              states: {
                prompt: {
                  entry: [send((context) => ({
                    type: "SPEAK",
                    value:`Hur heter detta djur? ${insertImage("eagle")}`,
                  })),
                  send((context) => ({
                    type: "SHOW_TRANSLATION",
                    value: insertTranslation("English translation: an eagle"),
                  }))],
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Hur heter detta djur?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Hur heter detta djur?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "Jag ska hjälpa dig. Den första bokstaven är Ö."
          ),
          on: { ENDSPEECH: "#root.dm.animals5" },
        },
        skip: {
          entry: say(
            "Låt oss hoppa över denna bild."
          ),
          on: { ENDSPEECH: "#root.dm.info" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Tyvärr, det är fel. Du kan prova igen.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    cheat5: {
      entry: send((context) => ({
        type: "SPEAK",
        value: "Jag ska visa dig fusklappen. Du har tio sekunder på dig att titta på den." + insertImage("cheat"),
      })),
      on: { ENDSPEECH: "delayTransition5" },
    },

    delayTransition5: {
      entry: send(`ENDSPEECH`,{delay:10000}),
      on: {ENDSPEECH: '#root.dm.animals5'}
    },

    

    startTravel: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },
          {
            target: ".skip",
            cond: (context) => !!getEntity(context, "skip"),
          },
          {
            target: "cheatTravel",
            cond: (context) => !!getEntity(context, "cheat"),
          },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },
          {
            target: "travel1",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="detArX" && context.nluResult.prediction.entities[0].text.toLowerCase() ==="plan",
            actions: assign({
              points: (context) => 1,
            }),
          },
          {
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "Jag kan inte höra dig.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })],
              initial: "prompt",
              states: {
                prompt: {
                  entry: [send((context) => ({
                    type: "SPEAK",
                    value:`Vad ser du på bilden? ${insertImage("plane")}`,
                  })),
                  send((context) => ({
                    type: "SHOW_TRANSLATION",
                    value: insertTranslation("English translation: a plane"),
                  }))],
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: `Vad ser du på bilden?`,
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: `Vad ser du på bilden?`,
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "Jag ska hjälpa dig. Den första bokstaven är P."
          ),
          on: { ENDSPEECH: "#root.dm.startTravel" },
        },
        skip: {
          entry: say(
            "Låt oss hoppa över denna bild."
          ),
          on: { ENDSPEECH: "#root.dm.travel1" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Tyvärr, det är fel. Du kan prova igen.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    cheatTravel: {
      entry: send((context) => ({
        type: "SPEAK",
        value: "Jag ska visa dig fusklappen. Du har tio sekunder på dig att titta på den." + insertImage("cheat"),
      })),
      on: { ENDSPEECH: "delayTransitionTravel" },
    },

    delayTransitionTravel: {
      entry: send(`ENDSPEECH`,{delay:10000}),
      on: {ENDSPEECH: '#root.dm.startTravel'}
    },

    confirmStartTravel: {
      entry:[assign({count: 0})],
      initial: "prompt",
      on: {
        RECOGNISED: [
          {
            target: "startTravel",
            cond: (context) => !!getEntity(context, "confirmation"),
            actions: assign({
              confirmation: (context) => getEntity(context, "confirmation"),
            }),
          },
          {
            target: "welcome",
            cond: (context) => !!getEntity(context, "denial"),
            actions: assign({
              denial: (context) => getEntity(context, "denial"),
            }),
          },

          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },

          {
            target: ".nomatch",
          },

        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "Jag kan inte höra dig.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })], 
              initial: "prompt",
              states: {
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Du valde kategorin resa, bekräfta?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Du valde kategorin resa, bekräfta?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Du valde kategorin resa, bekräfta?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "Jag ska hjälpa dig. Kan du bekräfta att du vill ha kategorin resa?"
          ),
          on: { ENDSPEECH: "#root.dm.confirmStartAnimals" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Förlåt, jag förstod inte. Vi ska prova igen.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    travel1: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },
          {
            target: ".skip",
            cond: (context) => !!getEntity(context, "skip"),
          },
          {
            target: "cheatTravel1",
            cond: (context) => !!getEntity(context, "cheat"),
          },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },
          {
            target: "travel2",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="detArX" && context.nluResult.prediction.entities[0].text.toLowerCase() ==="resväska",
            actions: assign({
              points: (context) => 2,
            }),
          },
          {
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "Jag kan inte höra dig.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })],
              initial: "prompt",
              states: {
                prompt: {
                  entry: [send((context) => ({
                    type: "SPEAK",
                    value:`Vad ser du på bilden? ${insertImage("luggage")}`,
                  })),
                  send((context) => ({
                    type: "SHOW_TRANSLATION",
                    value: insertTranslation("English translation: a suitcase"),
                  }))],
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Vad ser du på bilden?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Vad ser du på bilden?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "Jag ska hjälpa dig. Den första bokstaven är S."
          ),
          on: { ENDSPEECH: "#root.dm.travel1" },
        },
        skip: {
          entry: say(
            "Låt oss hoppa över denna bild."
          ),
          on: { ENDSPEECH: "#root.dm.travel2" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Tyvärr, det är fel. Du kan prova igen.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    cheatTravel1: {
      entry: send((context) => ({
        type: "SPEAK",
        value: "Jag ska visa dig fuskl  appen. Du har tio sekunder på dig att titta på den." + insertImage("cheat"),
      })),
      on: { ENDSPEECH: "delayTransitionTravel1" },
    },

    delayTransitionTravel1: {
      entry: send(`ENDSPEECH`,{delay:10000}),
      on: {ENDSPEECH: '#root.dm.travel1'}
    },

    travel2: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },
          {
            target: ".skip",
            cond: (context) => !!getEntity(context, "skip"),
          },
          {
            target: "cheatTravel2",
            cond: (context) => !!getEntity(context, "cheat"),
          },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },
          {
            target: "travel3",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="detArX" && context.nluResult.prediction.entities[0].text.toLowerCase() ==="tåg",
            actions: assign({
              points: (context) => 3,
            }),
          },
          {
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "Jag kan inte höra dig.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })],
              initial: "prompt",
              states: {
                prompt: {
                  entry: [send((context) => ({
                    type: "SPEAK",
                    value:`Vad ser du på bilden? ${insertImage("train")}`,
                  })),
                  send((context) => ({
                    type: "SHOW_TRANSLATION",
                    value: insertTranslation("English translation: a train"),
                  }))],
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Vad ser du på bilden?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Vad ser du på bilden?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "Jag ska hjälpa dig. Den första bokstaven är T."
          ),
          on: { ENDSPEECH: "#root.dm.travel2" },
        },
        skip: {
          entry: say(
            "Låt oss hoppa över denna bild."
          ),
          on: { ENDSPEECH: "#root.dm.travel3" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Tyvärr, det är fel. Du kan prova igen.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    cheatTravel2: {
      entry: send((context) => ({
        type: "SPEAK",
        value: "Jag ska visa dig fuskl  appen. Du har tio sekunder på dig att titta på den." + insertImage("cheat"),
      })),
      on: { ENDSPEECH: "delayTransitionTravel2" },
    },

    delayTransitionTravel2: {
      entry: send(`ENDSPEECH`,{delay:10000}),
      on: {ENDSPEECH: '#root.dm.travel2'}
    },

    travel3: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },
          {
            target: ".skip",
            cond: (context) => !!getEntity(context, "skip"),
          },
          {
            target: "cheatTravel3",
            cond: (context) => !!getEntity(context, "cheat"),
          },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },
          {
            target: "travel4",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="detArX" && context.nluResult.prediction.entities[0].text.toLowerCase() ==="hav",
            actions: assign({
              points: (context) => 4,
            }),
          },
          {
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "Jag kan inte höra dig.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })],
              initial: "prompt",
              states: {
                prompt: {
                  entry: [send((context) => ({
                    type: "SPEAK",
                    value:`Vad ser du på bilden? ${insertImage("sea")}`,
                  })),
                  send((context) => ({
                    type: "SHOW_TRANSLATION",
                    value: insertTranslation("English translation: a sea"),
                  }))],
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Vad ser du på bilden?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Vad ser du på bilden?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "Jag ska hjälpa dig. Den första bokstaven är H."
          ),
          on: { ENDSPEECH: "#root.dm.travel3" },
        },
        skip: {
          entry: say(
            "Låt oss hoppa över denna bild."
          ),
          on: { ENDSPEECH: "#root.dm.travel4" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Tyvärr, det är fel. Du kan prova igen.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    cheatTravel3: {
      entry: send((context) => ({
        type: "SPEAK",
        value: "Jag ska visa dig fusklappen. Du har tio sekunder på dig att titta på den." + insertImage("cheat"),
      })),
      on: { ENDSPEECH: "delayTransitionTravel3" },
    },

    delayTransitionTravel3: {
      entry: send(`ENDSPEECH`,{delay:10000}),
      on: {ENDSPEECH: '#root.dm.travel3'}
    },

    travel4: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },
          {
            target: ".skip",
            cond: (context) => !!getEntity(context, "skip"),
          },
          {
            target: "cheatTravel4",
            cond: (context) => !!getEntity(context, "cheat"),
          },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },
          {
            target: "travel5",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="detArX" && context.nluResult.prediction.entities[0].text.toLowerCase() ==="karta",
            actions: assign({
              points: (context) => 5,
            }),
          },
          {
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "Jag kan inte höra dig.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })],
              initial: "prompt",
              states: {
                prompt: {
                  entry: [send((context) => ({
                    type: "SPEAK",
                    value:`Vad ser du på bilden? ${insertImage("map")}`,
                  })),
                  send((context) => ({
                    type: "SHOW_TRANSLATION",
                    value: insertTranslation("English translation: a map"),
                  }))],
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Vad ser du på bilden?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Vad ser du på bilden?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "Jag ska hjälpa dig. Den första bokstaven är K."
          ),
          on: { ENDSPEECH: "#root.dm.travel4" },
        },
        skip: {
          entry: say(
            "Låt oss hoppa över denna bild."
          ),
          on: { ENDSPEECH: "#root.dm.travel5" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Tyvärr, det är fel. Du kan prova igen.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    cheatTravel4: {
      entry: send((context) => ({
        type: "SPEAK",
        value: "Jag ska visa dig fusklappen. Du har tio sekunder på dig att titta på den." + insertImage("cheat"),
      })),
      on: { ENDSPEECH: "delayTransitionTravel4" },
    },

    delayTransitionTravel4: {
      entry: send(`ENDSPEECH`,{delay:10000}),
      on: {ENDSPEECH: '#root.dm.travel4'}
    },

    travel5: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },
          {
            target: ".skip",
            cond: (context) => !!getEntity(context, "skip"),
          },
          {
            target: "cheatTravel4",
            cond: (context) => !!getEntity(context, "cheat"),
          },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },
          {
            target: "info",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="detArX" && context.nluResult.prediction.entities[0].text.toLowerCase() ==="berg",
            actions: assign({
              points: (context) => 6,
            }),
          },
          {
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "Jag kan inte höra dig.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })],
              initial: "prompt",
              states: {
                prompt: {
                  entry: [send((context) => ({
                    type: "SPEAK",
                    value:`Vad ser du på bilden? ${insertImage("a mountain")}`,
                  })),
                  send((context) => ({
                    type: "SHOW_TRANSLATION",
                    value: insertTranslation("English translation: mountains"),
                  }))],
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Vad ser du på bilden?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Vad ser du på bilden?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "Jag ska hjälpa dig. Den första bokstaven är B."
          ),
          on: { ENDSPEECH: "#root.dm.travel5" },
        },
        skip: {
          entry: say(
            "Låt oss hoppa över denna bild."
          ),
          on: { ENDSPEECH: "#root.dm.info" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Tyvärr, det är fel. Du kan prova igen.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    cheatTravel5: {
      entry: send((context) => ({
        type: "SPEAK",
        value: "Jag ska visa dig fusklappen. Du har tio sekunder på dig att titta på den." + insertImage("cheat"),
      })),
      on: { ENDSPEECH: "delayTransitionTravel5" },
    },

    delayTransitionTravel5: {
      entry: send(`ENDSPEECH`,{delay:10000}),
      on: {ENDSPEECH: '#root.dm.travel5'}
    },

    startInstruments: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },
          {
            target: ".skip",
            cond: (context) => !!getEntity(context, "skip"),
          },
          {
            target: "cheatInstruments",
            cond: (context) => !!getEntity(context, "cheat"),
          },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },
          {
            target: "instruments1",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="detArX" && context.nluResult.prediction.entities[0].text.toLowerCase() ==="fiol",
            actions: assign({
              points: (context) => 1,
            }),
          },
          {
            target: "instruments1",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="detArX" && context.nluResult.prediction.entities[0].text.toLowerCase() ==="violin",
            actions: assign({
              points: (context) => 1,
            }),
          },
          {
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "Jag kan inte höra dig.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })],
              initial: "prompt",
              states: {
                prompt: {
                  entry: [send((context) => ({
                    type: "SPEAK",
                    value:`Vad heter instrumentet? ${insertImage("violin")}`,
                  })),
                  send((context) => ({
                    type: "SHOW_TRANSLATION",
                    value: insertTranslation("English translation: a violin"),
                  }))],
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: `Vad heter instrumentet?`,
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: `Vad heter instrumentet?`,
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            `Jag ska hjälpa dig. Den första bokstaven är F.`
          ),
          on: { ENDSPEECH: "#root.dm.startInstruments" },
        },
        skip: {
          entry: say(
            "Låt oss hoppa över denna bild."
          ),
          on: { ENDSPEECH: "#root.dm.instruments1" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Tyvärr, det är fel. Du kan prova igen.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    cheatInstruments: {
      entry: send((context) => ({
        type: "SPEAK",
        value: "Jag ska visa dig fusklappen. Du har tio sekunder på dig att titta på den." + insertImage("cheat"),
      })),
      on: { ENDSPEECH: "delayTransitionInstruments" },
    },

    delayTransitionInstruments: {
      entry: send(`ENDSPEECH`,{delay:10000}),
      on: {ENDSPEECH: '#root.dm.startInstruments'}
    },

    confirmStartInstruments: {
      entry:[assign({count: 0})],
      initial: "prompt",
      on: {
        RECOGNISED: [
          {
            target: "startInstruments",
            cond: (context) => !!getEntity(context, "confirmation"),
            actions: assign({
              confirmation: (context) => getEntity(context, "confirmation"),
            }),
          },
          {
            target: "welcome",
            cond: (context) => !!getEntity(context, "denial"),
            actions: assign({
              denial: (context) => getEntity(context, "denial"),
            }),
          },

          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },

          {
            target: ".nomatch",
          },

        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "Jag kan inte höra dig.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })], //shouldnt assign any count there, otherwise it will go to prompt 2 ie. if the person asks for help eg.
              initial: "prompt",
              states: {
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Du valde kategorin instrument, bekräfta?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Du valde kategorin instrument, bekräfta?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Du valde kategorin instrument, bekräfta?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "Jag ska hjälpa dig. I would like you to confirm if you want to choose the category instruments."
          ),
          on: { ENDSPEECH: "#root.dm.confirmStartInstruments" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Förlåt, jag förstod inte. Vi ska prova igen.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    instruments1: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },
          {
            target: ".skip",
            cond: (context) => !!getEntity(context, "skip"),
          },
          {
            target: "cheatInstruments1",
            cond: (context) => !!getEntity(context, "cheat"),
          },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },
          {
            target: "instruments2",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="detArX" && context.nluResult.prediction.entities[0].text.toLowerCase() ==="cello",
            actions: assign({
              points: (context) => 2,
            }),
          },
          {
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "Jag kan inte höra dig.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })],
              initial: "prompt",
              states: {
                prompt: {
                  entry: [send((context) => ({
                    type: "SPEAK",
                    value:`Vad heter instrumentet? ${insertImage("cello")}`,
                  })),
                  send((context) => ({
                    type: "SHOW_TRANSLATION",
                    value: insertTranslation("English translation: a cello"),
                  }))],
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Vad heter instrumentet?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Vad heter instrumentet?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            " Jag ska hjälpa dig. Den första bokstaven är C."
          ),
          on: { ENDSPEECH: "#root.dm.instruments1" },
        },
        skip: {
          entry: say(
            "Låt oss hoppa över denna bild."
          ),
          on: { ENDSPEECH: "#root.dm.instruments2" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Tyvärr, det är fel. Du kan prova igen.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    cheatInstruments1: {
      entry: send((context) => ({
        type: "SPEAK",
        value: "Jag ska visa dig fusklappen. Du har tio sekunder på dig att titta på den." + insertImage("cheat"),
      })),
      on: { ENDSPEECH: "delayTransitionInstruments1" },
    },

    delayTransitionInstruments1: {
      entry: send(`ENDSPEECH`,{delay:10000}),
      on: {ENDSPEECH: '#root.dm.instruments1'}
    },

    instruments2: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },
          {
            target: ".skip",
            cond: (context) => !!getEntity(context, "skip"),
          },
          {
            target: "cheatInstruments2",
            cond: (context) => !!getEntity(context, "cheat"),
          },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },
          {
            target: "instruments3",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="detArX" && context.nluResult.prediction.entities[0].text.toLowerCase() ==="klarinett",
            actions: assign({
              points: (context) => 3,
            }),
          },
          {
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "Jag kan inte höra dig.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })],
              initial: "prompt",
              states: {
                prompt: {
                  entry: [send((context) => ({
                    type: "SPEAK",
                    value:`Vad ser du på bilden? ${insertImage("clarinet")}`,
                  })),
                  send((context) => ({
                    type: "SHOW_TRANSLATION",
                    value: insertTranslation("English translation: a clarinet"),
                  }))],
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Vad ser du på bilden?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Vad ser du på bilden?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "Jag ska hjälpa dig. Den första bokstaven är K."
          ),
          on: { ENDSPEECH: "#root.dm.instruments2" },
        },
        skip: {
          entry: say(
            "Låt oss hoppa över denna bild."
          ),
          on: { ENDSPEECH: "#root.dm.instruments3" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Tyvärr, det är fel. Du kan prova igen.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    cheatInstruments2: {
      entry: send((context) => ({
        type: "SPEAK",
        value: "Jag ska visa dig fusklappen. Du har tio sekunder på dig att titta på den." + insertImage("cheat"),
      })),
      on: { ENDSPEECH: "delayTransitionInstruments2" },
    },

    delayTransitionInstruments2: {
      entry: send(`ENDSPEECH`,{delay:10000}),
      on: {ENDSPEECH: '#root.dm.instruments2'}
    },

    instruments3: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },
          {
            target: ".skip",
            cond: (context) => !!getEntity(context, "skip"),
          },
          {
            target: "cheatInstruments3",
            cond: (context) => !!getEntity(context, "cheat"),
          },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },
          {
            target: "instruments4",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="detArX" && context.nluResult.prediction.entities[0].text.toLowerCase() ==="dragspel",
            actions: assign({
              points: (context) => 4,
            }),
          },
          {
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "Jag kan inte höra dig.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })],
              initial: "prompt",
              states: {
                prompt: {
                  entry: [send((context) => ({
                    type: "SPEAK",
                    value:`Vad ser du på bilden? ${insertImage("accordion")}`,
                  })),
                  send((context) => ({
                    type: "SHOW_TRANSLATION",
                    value: insertTranslation("English translation: an accordion"),
                  }))],
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Vad ser du på bilden?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Vad ser du på bilden?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "Jag ska hjälpa dig. Den första bokstaven är D."
          ),
          on: { ENDSPEECH: "#root.dm.instruments3" },
        },
        skip: {
          entry: say(
            "Låt oss hoppa över denna bild."
          ),
          on: { ENDSPEECH: "#root.dm.instruments4" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Tyvärr, det är fel. Du kan prova igen.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    cheatInstruments3: {
      entry: send((context) => ({
        type: "SPEAK",
        value: "Jag ska visa dig fusklappen. Du har tio sekunder på dig att titta på den." + insertImage("cheat"),
      })),
      on: { ENDSPEECH: "delayTransitionInstruments3" },
    },

    delayTransitionInstruments3: {
      entry: send(`ENDSPEECH`,{delay:10000}),
      on: {ENDSPEECH: '#root.dm.instruments3'}
    },

    instruments4: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },
          {
            target: ".skip",
            cond: (context) => !!getEntity(context, "skip"),
          },
          {
            target: "cheatInstruments4",
            cond: (context) => !!getEntity(context, "cheat"),
          },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },
          {
            target: "instruments5",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="detArX" && context.nluResult.prediction.entities[0].text.toLowerCase() ==="orkester",
            actions: assign({
              points: (context) => 5,
            }),
          },
          {
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "Jag kan inte höra dig.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })],
              initial: "prompt",
              states: {
                prompt: {
                  entry: [send((context) => ({
                    type: "SPEAK",
                    value:`Vad ser du på bilden? ${insertImage("orchestra")}`,
                  })),
                  send((context) => ({
                    type: "SHOW_TRANSLATION",
                    value: insertTranslation("English translation: an orchestra"),
                  }))],
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Vad ser du på bilden?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Vad ser du på bilden?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "Jag ska hjälpa dig. Den första bokstaven är O."
          ),
          on: { ENDSPEECH: "#root.dm.instruments4" },
        },
        skip: {
          entry: say(
            "Låt oss hoppa över denna bild."
          ),
          on: { ENDSPEECH: "#root.dm.instruments5" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Tyvärr, det är fel. Du kan prova igen.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    cheatInstruments4: {
      entry: send((context) => ({
        type: "SPEAK",
        value: "Jag ska visa dig fusklappen. Du har tio sekunder på dig att titta på den." + insertImage("cheat"),
      })),
      on: { ENDSPEECH: "delayTransitionInstruments4" },
    },

    delayTransitionInstruments4: {
      entry: send(`ENDSPEECH`,{delay:10000}),
      on: {ENDSPEECH: '#root.dm.instruments4'}
    },

    instruments5: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },
          {
            target: ".skip",
            cond: (context) => !!getEntity(context, "skip"),
          },
          {
            target: "cheatInstruments5",
            cond: (context) => !!getEntity(context, "cheat"),
          },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },
          {
            target: "info",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="detArX" && context.nluResult.prediction.entities[0].text.toLowerCase() ==="trummor",
            actions: assign({
              points: (context) => 6,
            }),
          },
          {
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "Jag kan inte höra dig.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
        prompt: {
          initial: "choice",

          states: {
            choice: {
              always: [
                {
                  target: "p2.hist",
                  cond: (context) => context.count === 1,
                },
                {
                  target: "p3.hist",
                  cond: (context) => context.count === 2,
                },
                {
                  target: "#root.dm.init",
                  cond: (context) => context.count === 3,
                },
                "p1",
              ],
            },
            p1: {
              entry: [assign({ count: 1 })],
              initial: "prompt",
              states: {
                prompt: {
                  entry: [send((context) => ({
                    type: "SPEAK",
                    value:`Vad ser du på bilden? ${insertImage("drums")}`,
                  })),
                  send((context) => ({
                    type: "SHOW_TRANSLATION",
                    value: insertTranslation("English translation: drums"),
                  }))],
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p2: {
              entry: [assign({count: 2})],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Vad ser du på bilden?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
            p3: {
              entry: [assign({ count: 3 })],
              initial: "prompt",
              states: {
                hist: { type: "history" },
                prompt: {
                  entry: send({
                    type: "SPEAK",
                    value: "Vad ser du på bilden?",
                  }),
                  on: { ENDSPEECH: "ask" },
                },
                ask: {
                  entry: send("LISTEN"),
                },
              },
            },
          },
        },
        help: {
          entry: say(
            "Jag ska hjälpa dig. Den första bokstaven är T."
          ),
          on: { ENDSPEECH: "#root.dm.instruments5" },
        },
        skip: {
          entry: say(
            "Låt oss hoppa över denna bild."
          ),
          on: { ENDSPEECH: "#root.dm.info" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Tyvärr, det är fel. Du kan prova igen.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    cheatInstruments5: {
      entry: send((context) => ({
        type: "SPEAK",
        value: "Jag ska visa dig fusklappen. Du har tio sekunder på dig att titta på den." + insertImage("cheat"),
      })),
      on: { ENDSPEECH: "delayTransitionInstruments5" },
    },

    delayTransitionInstruments5: {
      entry: send(`ENDSPEECH`,{delay:10000}),
      on: {ENDSPEECH: '#root.dm.instruments5'}
    },

    info: {
      entry: [send((context) => ({
        type: "SPEAK",
        value: `Grattis! Du har klarat spelet med ${context.points} poäng!`,
      })),
      send((context) => ({
        type: "SHOW_TRANSLATION",
        value: insertTranslation(`Congratulations! Your point(s): ${context.points}`),
      }))],
      on: { ENDSPEECH: "init" },
    },
  },
};

const kbRequest = (text: string) =>
  fetch(
    new Request(
      `https://cors.eu.org/https://api.duckduckgo.com/?q=${text}&format=json&skip_disambig=1`
    )
  ).then((data) => data.json());