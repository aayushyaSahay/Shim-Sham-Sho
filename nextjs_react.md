# Setting up Next.js and React

Next.js is a React framework that provides a great starting point for building React applications. Here's a step-by-step guide to set up a new Next.js project:

1. **Prerequisites**: 
   - Ensure you have Node.js installed on your computer. You can download it from [nodejs.org](https://nodejs.org/).

2. **Create a new Next.js project**:
   Open your terminal and run the following command:
   ```
   npx create-next-app@latest my-tic-tac-toe
   ```

3. **Configuration**:
   You'll be prompted with several configuration options. Here are the recommended choices:
   - Would you like to use TypeScript? › Yes
   - Would you like to use ESLint? › Yes
   - Would you like to use Tailwind CSS? › Yes
   - Would you like to use `src/` directory? › No
   - Would you like to use App Router? › Yes
   - Would you like to customize the default import alias? › No

4. **Navigate to your project folder**:
   ```
   cd my-tic-tac-toe
   ```

5. **Start the development server**:
   ```
   npm run dev
   ```

6. **View your application**:
   Open a web browser and go to `http://localhost:3000`. You should see the Next.js welcome page.

7. **Start building**:
   - Your main application code will go in the `app` directory.
   - Create new pages by adding new directories in the `app` folder.
   - The `pages/api` directory is for API routes if you need them.

8. **Add custom components**:
   - Create a `components` folder in your project root.
   - Add your Custom Tic-Tac-Toe component here.

9. **Use your component**:
   Replace the contents of `app/page.js` with:
   ```jsx
   import CustomTicTacToe from '../components/CustomTicTacToe'

   export default function Home() {
     return (
       <main>
         <CustomTicTacToe />
       </main>
     )
   }
   ```

That's it! You now have a Next.js project set up with React ready to go.