# LearnFlow frontend
1. `cp .env.example .env.local` (set backend URL; backend must allow CORS from http://localhost:3000)
2. `npm install && npm run dev`
Swagger is the contract; fields the blueprint added but swagger omits (quizId, scorePercentage, topicStatus…) are read defensively.
