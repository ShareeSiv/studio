# **App Name**: DocuChat

## Core Features:

- Chat Session Management: Implement a chat session management that can allow the creation of new sessions and also persist and render chat prompts from the session history via a dropdown.
- PDF Document Upload: Implement a component where users can upload pdf documents to supplement prompts.
- Text Prompting UI: Implement the front end components to take in a text prompt to be used as context for an LLM API call.
- Document AI Tool: Tool that sends the PDF documents and the current text prompt to a hosted LLM service such as Vertex or Gemini and returns a relevant result. This feature will reason about whether the included document should influence the answer.
- Delete PDF Feature: Implement a button that will allow the user to delete attached documents for privacy or any other reason.

## Style Guidelines:

- Primary color: Dark blue (#3F51B5) to create a professional and trustworthy atmosphere for document interaction.
- Background color: Light grey (#F0F2F5) for a clean and modern look that's easy on the eyes during extended use.
- Accent color: Teal (#009688) for interactive elements and call-to-actions, providing a subtle contrast.
- Body: 'Inter', a sans-serif font to make sure the interface has a clean, objective look, and headline: 'Space Grotesk', a sans-serif font with a techy feel, is a great option for an application involving document interaction.
- Use minimalist and professional icons for file uploads, session management, and other actions.
- Maintain a clean and intuitive layout with clear sections for chat sessions, document uploads, and the text input area.
- Use subtle transitions and animations for loading states, document uploads, and new messages.