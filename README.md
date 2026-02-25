## How to Download and Run Locally

Follow these step-by-step instructions to get the application running on your personal computer.

### **Prerequisites**
Before you begin, ensure you have the following installed on your computer:
* **Node.js**: Download and install it from [https://nodejs.org/](https://nodejs.org/) (Recommended version: LTS).
* **Git** (Optional but recommended): For downloading the code via terminal. Download from [https://git-scm.com/](https://git-scm.com/).

### **Step 1: Download the Code**
You can either clone the repository using Git or download it as a ZIP file.

**Option A - Using Git (Recommended):**
Open your terminal or command prompt and run:
```bash
git clone <YOUR_REPOSITORY_URL_HERE>
cd sakhipurbazar-main
```

**Option B - Download ZIP:**
1. Click the green **Code** button at the top right of the repository page.
2. Select **Download ZIP**.
3. Extract the downloaded ZIP file to a folder on your computer.
4. Open the extracted folder and open a terminal inside it.

### **Step 2: Install Dependencies**
Make sure your terminal is opened inside the project folder (`sakhipurbazar-main`). Run the following command to download all required packages.

**Note:** This project uses `pnpm`. Please use `pnpm` instead of `npm` to ensure all dependencies match the exact versions specified in the `pnpm-lock.yaml` file.

First, install `pnpm` (if you haven't already):
```bash
npm install -g pnpm
```

Then install the project's dependencies:
```bash
pnpm install
```

### **Step 3: Setup Environment Variables**
The application requires an API key to function.
1. Create a new file named `.env.local` in the root folder of the project.
2. Open the `.env.local` file and add your Gemini API key like this:
```env
GEMINI_API_KEY=your_api_key_here
```
*(Replace `your_api_key_here` with your actual Gemini API key obtained from Google AI Studio)*

### **Step 4: Run the Application**
Once everything is set up, start the development server by running:
```bash
pnpm dev
```
Open your web browser and navigate to `http://localhost:3000` (or the URL shown in your terminal output) to view the application in action.
