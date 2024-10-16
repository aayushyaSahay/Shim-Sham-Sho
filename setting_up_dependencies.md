# Dependencies and Setup for Custom Tic-Tac-Toe Game

## Core Dependencies

1. React
2. Next.js (recommended for easy setup with Tailwind and shadcn/ui)

## UI Libraries

3. Tailwind CSS
4. shadcn/ui components
5. Lucide React (for icons)

## Setup Instructions

1. Create a new Next.js project with Tailwind CSS:
   ```
   npx create-next-app@latest my-tic-tac-toe --typescript --tailwind --eslint
   cd my-tic-tac-toe
   ```

2. Install shadcn/ui CLI:
   ```
   npm install -D @shadcn/ui
   ```

3. Initialize shadcn/ui:
   ```
   npx shadcn-ui init
   ```

4. Install required shadcn/ui components:
   ```
   npx shadcn-ui add alert button
   ```

5. Install Lucide React:
   ```
   npm install lucide-react
   ```

6. Create a new file for the Tic-Tac-Toe component (e.g., `components/CustomTicTacToe.tsx`) and paste the provided code.

7. Import and use the component in your page (e.g., in `pages/index.tsx`):
   ```jsx
   import CustomTicTacToe from '../components/CustomTicTacToe';

   export default function Home() {
     return (
       <main>
         <CustomTicTacToe />
       </main>
     );
   }
   ```

8. Run the development server:
   ```
   npm run dev
   ```

Your Custom Tic-Tac-Toe game should now be running on `http://localhost:3000`.