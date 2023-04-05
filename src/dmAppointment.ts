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
  "create a meeting": {
    intent: "None",
    entities: { createMeeting: "Create a meeting" },
  },
  "who is": {
    intent: "None",
    entities: { knowFamous: "Know someone famous" },
  },
  lecture: {
    intent: "None",
    entities: { title: "Dialogue systems lecture" },
  },
  "chasing unicorns with my friends": {
    intent: "None",
    entities: { title: "Chasing unicorns with your friends" },
  },
  lunch: {
    intent: "None",
    entities: { title: "Lunch at the canteen" },
  }, 
  "a coding session with my mates": {
    intent: "None",
    entities: { title: "Coding session with mates" },
  },
  "a coding session": {
    intent: "None",
    entities: { title: "Coding session" },
  },
  "a date": {
    intent: "None",
    entities: { title: "Date" },
  },
  "a movie night": {
    intent: "None",
    entities: { title: "Movie night" },
  },
  "on monday": {
    intent: "None",
    entities: { day: "Monday" },
  },
  "on tuesday": {
    intent: "None",
    entities: { day: "Tuesday" },
  },
  "on wednesday": {
    intent: "None",
    entities: { day: "Wednesday" },
  },
  "on thursday": {
    intent: "None",
    entities: { day: "Thursday" },
  },
  "on friday": {
    intent: "None",
    entities: { day: "Friday" },
  },
  "on saturday": {
    intent: "None",
    entities: { day: "Saturday" },
  },
  "on sunday": {
    intent: "None",
    entities: { day: "Sunday" },
  },
  "sunday": {
    intent: "None",
    entities: { day: "Sunday" },
  },
  "monday": {
    intent: "None",
    entities: { day: "Monday" },
  },
  "tuesday": {
    intent: "None",
    entities: { day: "Tuesday" },
  },
  "wednesday": {
    intent: "None",
    entities: { day: "Wednesday" },
  },
  "thursday": {
    intent: "None",
    entities: { day: "Thursday" },
  },
  "friday": {
    intent: "None",
    entities: { day: "Friday" },
  },
  "saturday": {
    intent: "None",
    entities: { day: "Saturday" },
  },
  "at 10": {
    intent: "None",
    entities: { time: "10:00" },
  },
  "at 11": {
    intent: "None",
    entities: { time: "11:00" },
  },
  "at 12": {
    intent: "None",
    entities: { time: "12:00" },
  },
  "at 13": {
    intent: "None",
    entities: { time: "13:00" },
  },
  "at 14": {
    intent: "None",
    entities: { time: "14:00" },
  },
  "at 15": {
    intent: "None",
    entities: { time: "15:00" },
  },
  "at 16": {
    intent: "None",
    entities: { time: "16:00" },
  },
  "at 17": {
    intent: "None",
    entities: { time: "17:00" },
  },
  "at 18": {
    intent: "None",
    entities: { time: "18:00" },
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
  }
};

const getEntity = (context: SDSContext, entity: string) => {
  console.log('nluResult:');
  console.log(context.nluResult);
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
      initial: "prompt",
      on: {
        RECOGNISED: [
          {
            target: "getInfo",
            cond: (context) => context.recResult[0].utterance.toLowerCase().includes("who is"),
            actions: assign({
              name: (context) => context.recResult[0].utterance.toLowerCase().replace("who is",""),
            }),
          },
          {
            target: "CreateAMeeting",
            // cond: (context)  ....&& 
            cond: (context) => getEntity(context, "createMeeting") === "Create a meeting",
            actions: assign({
              createMeeting: (context) => getEntity(context, "createMeeting"),
            }),
          },
          
          {
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".prompt",
      },
      states: {
        prompt: {
          entry: say("Hey Celine. Please tell me if you would like to create a meeting or get information about someone famous."),
          on: { ENDSPEECH: "ask" },
        },
        ask: {
          entry: send("LISTEN"),
          
        },
        nomatch: {
          entry: say(
            "Sorry, I don't know what it is. Tell me if you want to create a meeting or get to know someone famous."
          ),
          on: { ENDSPEECH: "ask" },
        },
      },
    },
    getInfo: {
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
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".prompt",
      },
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
        nomatch: {
          entry: say(
            "Sorry, I don't know what it is. Tell me if you would like to meet them."
          ),
          on: { ENDSPEECH: "ask" },
        },
      },
    },
    CreateAMeeting: {
      initial: "prompt",
      on: {
        RECOGNISED: [
          {
            target: "whichDay", 
            internal: false,
            cond: (context) => !!getEntity(context, "title"),
            actions: assign({
              title: (context) => getEntity(context, "title"),
            }),
          },
          {
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".prompt",
      },
      states: {
        prompt: {
          entry: say("Let's happily create a meeting. What is it about?"),
          on: { ENDSPEECH: "ask" },
        },
        ask: {
          entry: send("LISTEN"),
          
        },
        nomatch: {
          entry: say(
            "Sorry, I don't know what it is. Tell me what is your meeting about."
          ),
          on: { ENDSPEECH: "ask" },
        },
      },
    },
    whichDay: {
      initial: "prompt",
      on: {
        RECOGNISED: [
          {
            target: "wholeDay",
            internal: false,
            cond: (context) => !!getEntity(context, "day"),
            actions: assign({
              day: (context) => getEntity(context, "day"),
            }),
          },
          {
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".prompt",
      },
      states: {
        prompt: {
          entry: say("How wonderful. Which day do you want your meeting?"),
          on: { ENDSPEECH: "ask" },
        },
        ask: {
          entry: send("LISTEN"),
          
        },
        nomatch: {
          entry: say(
            "Sorry, I don't know what it is. Tell me a day I know."
          ),
          on: { ENDSPEECH: "ask" },
        },
      },
    },
    wholeDay: {
      initial: "prompt",
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
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".prompt",
      },
      states: {
        prompt: {
          entry: say("Will it take the whole day?"),
          on: { ENDSPEECH: "ask" },
        },
        ask: {
          entry: send("LISTEN"),
          
        },
        nomatch: {
          entry: say(
            "Sorry, I don't know what it is. Please confirm whether the meeting will last the whole day or not."
          ),
          on: { ENDSPEECH: "ask" },
        },
      },
    },
    whatTime: {
      initial: "prompt",
      on: {
        RECOGNISED: [
          {
            target: "requestConfirmationTime",
            cond: (context) => !!getEntity(context, "time"),
            actions: assign({
              time: (context) => getEntity(context, "time"),
            }),
          },
          {
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".prompt",
      },
      states: {
        prompt: {
          entry: say("What time is your meeting?"),
          on: { ENDSPEECH: "ask" },
        },
        ask: {
          entry: send("LISTEN"),
        
        },
        nomatch: {
          entry: say(
            "Sorry, I don't know what it is. Tell me a time I know, any full hour between 10 in the morning and 18 in the evening."
          ),
          on: { ENDSPEECH: "ask" },
        },
      },
    },
    requestConfirmation: {
      initial: "prompt",
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
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".prompt",
      },
      states: {
        prompt: {
          entry: send((context) => ({
            type: "SPEAK",
            value:`"Do you want me to create a meeting like this: create a meeting titled ${context.title}, on ${context.day} for the whole day?`,
          })),
          on: { ENDSPEECH: "ask" },
        },
        ask: {
          entry: send("LISTEN"),
        
        },
        nomatch: {
          entry: say(
            "Sorry, I don't know what it is. Please confirm if you would like me to create this meeting."
          ),
          on: { ENDSPEECH: "ask" },
        },
      },
    },
    requestConfirmationTime: {
      initial: "prompt",
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
            target: ".nomatch",
          },
        ],
        TIMEOUT: ".prompt",
      },
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
        nomatch: {
          entry: say(
            "Sorry, I don't know what it is. Please confirm if you would like me to create this meeting."
          ),
          on: { ENDSPEECH: "ask" },
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