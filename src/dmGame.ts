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
  "help": {
    intent: "None",
    entities: { help: "help"},
  },
  "no": {
    intent: "None",
    entities: { denial: "no"},
  },
  "nope": {
    intent: "None",
    entities: { denial: "no"},
  },
  "no way": {
    intent: "None",
    entities: { denial: "no"},
  },
  "nah": {
    intent: "None",
    entities: { denial: "no"},
  },
  "yes": {
    intent: "None",
    entities: { confirmation:"yes"},
  },
  "sure": {
    intent: "None",
    entities: { confirmation:"yes"},
  },
  "of course": {
    intent: "None",
    entities: { confirmation:"yes"},
  },
  "yay": {
    intent: "None",
    entities: { confirmation:"yes"},
  },
  "yes please": {
    intent: "None",
    entities: { confirmation:"yes"},
  },
};

const getEntity = (context: SDSContext, entity: string) => {
  console.log('nluResult:');
  console.log(context.nluResult);
  console.log('Name:');
  console.log(context.name);
  // lowercase the utterance and remove tailing "."
  let u = context.recResult[0].utterance.toLowerCase().replace(/\.$/g, "");
  if (u in grammar) {
    if (entity in grammar[u].entities) {
      return grammar[u].entities[entity];
    }
  }
  return false;
};



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
            target: "getInfo",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="Know someone famous" && context.recResult[0].confidence >= 0.8,
            actions: assign({
              name: (context) => context.nluResult.prediction.entities[0].text,
            }),
          },
          {
            target: "confirmGetInfo",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="Know someone famous" && context.recResult[0].confidence < 0.8,
            actions: assign({
              name: (context) => context.nluResult.prediction.entities[0].text,
            }),
          },
          {
            target: "confirmCreateAMeeting",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="Create a meeting" && context.recResult[0].confidence < 0.8,
          },
          {
            target: "CreateAMeeting",
            // cond: (context)  ....&& 
            cond: (context) => (context.nluResult.prediction.topIntent) ==="Create a meeting" && context.recResult[0].confidence >= 0.8,
          },

          {
            target: ".nomatch",
            //cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },

        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "I don't quite hear you.",
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
                    value: "Hello Celine, welcome to your augmented model. If you need help, feel free to ask for it at any time, by simply saying help. Now, please tell me if you would like to create a meeting or get information about someone famous.",
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
                    value: "Second prompt: Would you like to create a meeting, or get to know someone famous?",
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
                    value: "Third prompt: Would you like to create a meeting, or get to know someone famous?",
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
            "You just asked for help. I would like to know if you want to create a meeting, or get information about someone famous. You could for example ask Who is John Lennon, or simply say Create a meeting."
          ),
          on: { ENDSPEECH: "#root.dm.welcome" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Sorry, I didn't catch that. Maybe we should try again.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    confirmCreateAMeeting: {
      entry:[assign({count: 0})],
      initial: "prompt",
      on: {
        RECOGNISED: [
          {
            target: "CreateAMeeting",
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
            value: "I don't quite hear you.",
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
                    value: "You want to create a meeting, is that right?",
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
                    value: "Second prompt: You would like to create a meeting, is that right?",
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
                    value: "Third prompt: You would like to create a meeting, is that right?",
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
            "You just asked for help. I would like you to confirm if you want to create a meeting."
          ),
          on: { ENDSPEECH: "#root.dm.confirmCreateAMeeting" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Sorry, I didn't catch that. Maybe we should try again.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    confirmGetInfo: {
      entry:[assign({count: 0})],
      initial: "prompt",
      on: {
        RECOGNISED: [
          {
            target: "getInfo",
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
            value: "I don't quite hear you.",
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
                  entry: send((context) => ({
                    type: "SPEAK",
                    value: `You want to get information about ${context.name}, right?`,
                  })),
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
                  entry: send((context) => ({
                    type: "SPEAK",
                    value: `Second prompt: You want to get information about ${context.name}, right?`,
                  })),
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
                  entry: send((context) => ({
                    type: "SPEAK",
                    value: `Third prompt: You want to get information about ${context.name}, right?`,
                  })),
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
            "You just asked for help. I would like you to confirm if you want to get information about someone famous."
          ),
          on: { ENDSPEECH: "#root.dm.confirmGetInfo" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Sorry, I didn't catch that. Maybe we should try again.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    getInfo: {
      entry:[assign({count: 0})],
      invoke: {
        src: (context, event) => kbRequest(context.name),
        onDone: 
          {
            target: ".prompt",
            actions: assign({
              famousRequest: (context,event) => event.data.AbstractText
            }), 
          },
        onError:{
          target: "getInfo",
          },
      },
      states: {
        prompt: {
          entry: send((context,event) => ({
            type: "SPEAK",
            value:`${context.famousRequest}`,
          })),
          on: { ENDSPEECH: "#root.dm.askToMeet" },

        },
        ask: {
          entry: send("LISTEN"),
          
        },
      },
      
    },
    askToMeet: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: "whichDay",
            cond: (context) => !!getEntity(context, "confirmation"),
            actions: assign({
              confirmation: (context) => getEntity(context, "confirmation"),title: (context) => `Meeting with ${context.name}`,
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
            value: "I don't quite hear you.",
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
                  entry: send((context) => ({
                    type: "SPEAK",
                    value:`"Would you like to meet ${context.name}?`,
                  })),
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
                    value: "Second prompt: Would you like to meet them?",
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
                    value: "Third prompt: Would you like to meet them?",
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
            "You just asked for help. I would like to know if you want to meet this famous person. You can simply answer yes, or no."
          ),
          on: { ENDSPEECH: "#root.dm.askToMeet" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Sorry, I didn't catch that. Maybe we should try again.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    CreateAMeeting: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "denial"),
          },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },
          {
            target: "whichDay", 
            internal: false,
            cond: (context) => (context.nluResult.prediction.topIntent) ==="Meeting about" && context.recResult[0].confidence >= 0.8,
            actions: assign({
              title: (context) => context.nluResult.prediction.entities[0].text,
            }),

          },
          {
            target: "confirmMeetingAbout",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="Meeting about" && context.recResult[0].confidence < 0.8,
            actions: assign({
              title: (context) => context.nluResult.prediction.entities[0].text,
            }),
          },
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },


        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "I don't quite hear you.",
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
                    value: "Let's happily create a meeting. What is it about?",
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
                    value: "Second prompt: What is your meeting about?",
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
                    value: "Third prompt: What is your meeting about?",
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
            "You just asked for help. I would like to know what your meeting is about. You could for example tell me that you are meeting with your friends, or that you are going on a date. In which case - congratulations!"
          ),
          on: { ENDSPEECH: "#root.dm.CreateAMeeting" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Sorry, I didn't catch that. Maybe we should try again.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    confirmMeetingAbout: {
      entry:[assign({count: 0})],
      initial: "prompt",
      on: {
        RECOGNISED: [
          {
            target: "whichDay",
            cond: (context) => !!getEntity(context, "confirmation"),
            actions: assign({
              confirmation: (context) => getEntity(context, "confirmation"),
            }),
          },
          {
            target: "CreateAMeeting",
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
            value: "I don't quite hear you.",
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
                  entry: send((context) => ({
                    type: "SPEAK",
                    value: `You want to create a meeting titled ${context.title}, right?`,
                  })),
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
                  entry: send((context) => ({
                    type: "SPEAK",
                    value: `Second prompt: You want to create a meeting titled ${context.title}, right?`,
                  })),
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
                  entry: send((context) => ({
                    type: "SPEAK",
                    value: `Third prompt: You want to create a meeting titled ${context.title}, right?`,
                  })),
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
            "You just asked for help. I would like you to confirm if you want to create this meeting. You can just say yes or no."
          ),
          on: { ENDSPEECH: "#root.dm.confirmMeetingAbout" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Sorry, I didn't catch that. Maybe we should try again.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    whichDay: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },
          {
            target: "wholeDay",
            internal: false,
            cond: (context) => (context.nluResult.prediction.topIntent) ==="Week day" && context.recResult[0].confidence >= 0.8,
            actions: assign({
              day: (context) => context.nluResult.prediction.entities[0].text,
            }),
          },
          {
            target: "confirmWeekDay",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="Week day" && context.recResult[0].confidence < 0.8,
            actions: assign({
              day: (context) => context.nluResult.prediction.entities[0].text,
            }),
          },
 
        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "I don't quite hear you.",
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
                    value: "How wonderful. Which day do you want your meeting?",
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
                    value: "Second prompt: Which day do you want your meeting?",
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
                    value: "Third prompt: Which day do you want your meeting?",
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
            "You just asked for help. I would like to know which day is your meeting. To answer, you can just say any day of the week, like Monday or Friday."
          ),
          on: { ENDSPEECH: "#root.dm.whichDay" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Sorry, I didn't catch that. Maybe we should try again.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    confirmWeekDay: {
      entry:[assign({count: 0})],
      initial: "prompt",
      on: {
        RECOGNISED: [
          {
            target: "wholeDay",
            cond: (context) => !!getEntity(context, "confirmation"),
            actions: assign({
              confirmation: (context) => getEntity(context, "confirmation")
            }),
          },
          {
            target: "whichDay",
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
            value: "I don't quite hear you.",
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
                  entry: send((context) => ({
                    type: "SPEAK",
                    value: `You want to create a meeting on ${context.day}, right?`,
                  })),
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
                  entry: send((context) => ({
                    type: "SPEAK",
                    value: `Second prompt: You want to create a meeting on ${context.day}, right?`,
                  })),
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
                  entry: send((context) => ({
                    type: "SPEAK",
                    value: `Third prompt: You want to create a meeting on ${context.day}, right?`,
                  })),
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
          entry: send((context) => ({
            type: "SPEAK",
            value: `You just asked for help. I would like you to confirm if you want to create a meeting on ${context.day}. You can just say yes or no.`,
          })),
          on: { ENDSPEECH: "#root.dm.confirmWeekDay" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Sorry, I didn't catch that. Maybe we should try again.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    wholeDay: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: "requestConfirmation",
            cond: (context) => !!getEntity(context, "confirmation"),
            actions: assign({
              confirmation: (context) => getEntity(context, "confirmation"),
            }),
          },
          {
            target: "whatTime",
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
            value: "I don't quite hear you.",
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
                    value: "Will it take the whole day?",
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
                    value: "Second prompt: Will it take the whole day?",
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
                    value: "Third prompt: Will it take the whole day?",
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
            "You just asked for help. I would like to know whether or not your meeting will last the whole day. You can just answer by saying yes or no."
          ),
          on: { ENDSPEECH: "#root.dm.wholeDay" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Sorry, I didn't catch that. Maybe we should try again.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    whatTime: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: ".help",
            cond: (context) => !!getEntity(context, "help"),
          },

          {
            target: "requestConfirmationTime",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="Hour" && context.recResult[0].confidence >= 0.8,
            actions: assign({
              time: (context) => context.nluResult.prediction.entities[0].text,
            }),
          },
          {
            target: "confirmWhatTime",
            cond: (context) => (context.nluResult.prediction.topIntent) ==="Hour" && context.recResult[0].confidence < 0.8,
            actions: assign({
              time: (context) => context.nluResult.prediction.entities[0].text,
            }),
          },

          // {
          //   target: ".help",
          //   cond: (context) => (context.nluResult.prediction.topIntent) ==="Get Help",
          // },
          {
            target: ".nomatch",
            cond: (context) => (context.nluResult.prediction.entities.length) === 0,
          },

        ],
        TIMEOUT: ".noinput",
      },
      states: {
        noinput: {
          entry: send({
            type: "SPEAK",
            value: "I don't quite hear you.",
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
                    value: "What time is your meeting?",
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
                    value: "Second prompt: What time is your meeting?",
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
                    value: "Third prompt: What time is your meeting?",
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
            "You just asked for help. Please let me know at what time is your meeting by using the British time system. In other words, use am and pm. For example, 2pm or 11am."
          ),
          on: { ENDSPEECH: "#root.dm.whatTime" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Sorry, I didn't catch that. Maybe we should try again.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    confirmWhatTime: {
      entry:[assign({count: 0})],
      initial: "prompt",
      on: {
        RECOGNISED: [
          {
            target: "requestConfirmationTime",
            cond: (context) => !!getEntity(context, "confirmation"),
            actions: assign({
              confirmation: (context) => getEntity(context, "confirmation")
            }),
          },
          {
            target: "whatTime",
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
            value: "I don't quite hear you.",
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
                  entry: send((context) => ({
                    type: "SPEAK",
                    value: `You want to create a meeting at ${context.time}, right?`,
                  })),
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
                  entry: send((context) => ({
                    type: "SPEAK",
                    value: `Second prompt: You want to create a meeting at ${context.time}, right?`,
                  })),
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
                  entry: send((context) => ({
                    type: "SPEAK",
                    value: `Third prompt: You want to create a meeting at ${context.time}, right?`,
                  })),
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
          entry: send((context) => ({
            type: "SPEAK",
            value: `You just asked for help. I would like you to confirm if you want to create a meeting at ${context.time}. You can just say yes or no.`,
          })),
          on: { ENDSPEECH: "#root.dm.confirmWhatTime" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Sorry, I didn't catch that. Maybe we should try again.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    requestConfirmation: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: "info",
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
            value: "I don't quite hear you.",
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
                  entry: send((context) => ({
                    type: "SPEAK",
                    value:`"Do you want me to create a meeting like this: meeting titled ${context.title}, on ${context.day} for the whole day?`,
                  })),
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
                    value: "Second prompt: Would you like me to create this meeting?",
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
                    value: "Third prompt: Would you like me to create this meeting?",
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
            "You just asked for help. Please let me know if you would like me to create this meeting or not by just saying yes or no."
          ),
          on: { ENDSPEECH: "#root.dm.requestConfirmation" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Sorry, I didn't catch that. Maybe we should try again.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    requestConfirmationTime: {
      initial: "prompt",
      entry:[assign({count: 0})],
      on: {
        RECOGNISED: [
          {
            target: "info",
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
            value: "I don't quite hear you.",
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
                  entry: send((context) => ({
                    type: "SPEAK",
                    value:`"Do you want me to create a meeting titled ${context.title}, on ${context.day} at ${context.time}?`,
                  })),
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
                  entry: send((context) => ({
                    type: "SPEAK",
                    value:`Second prompt: Do you want me to create a meeting titled ${context.title}, on ${context.day} at ${context.time}?`,
                  })),
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
                  entry: send((context) => ({
                    type: "SPEAK",
                    value:`Third prompt: Do you want me to create a meeting titled ${context.title}, on ${context.day} at ${context.time}?`,
                  })),
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
            "You just asked for help. Please let me know if you would like me to create this meeting or not by just saying yes or no."
          ),
          on: { ENDSPEECH: "#root.dm.requestConfirmationTime" },
        },
        nomatch: {
          entry: send({
            type: "SPEAK",
            value: "Sorry, I didn't catch that. Maybe we should try again.",
          }),
          on: {
            ENDSPEECH: "prompt",
          },
        },
      },
    },

    info: {
      entry: send((context) => ({
        type: "SPEAK",
        value: `Great, your meting has been created!`,
      })),
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