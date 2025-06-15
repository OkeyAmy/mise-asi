
export const updateUserNotesTool = {
  name: "updateUserNotes",
  description: "Updates or appends to the user's general notes. Use this to remember miscellaneous facts, preferences, or context that don't fit into other specific functions. For example: 'My friend is visiting next week', 'I prefer spicy food', 'I want to try cooking more with fish'. The new notes will be appended to existing ones.",
  parameters: {
    type: "object",
    properties: {
      notes: {
        type: "string",
        description: "The new piece of information or note to remember about the user.",
      },
    },
    required: ["notes"],
  },
};
