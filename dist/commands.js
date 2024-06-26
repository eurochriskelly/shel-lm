var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { systemPromptSuggest, systemPromptExplain, userPrompt } from "./prompts.js";
import chalk from "chalk";
const { yellow, cyan, red, blue } = chalk;
export const getCommands = (type, input) => __awaiter(void 0, void 0, void 0, function* () {
    const chatModel = new ChatOpenAI({
    // openAIApiKey: process.env.OPENAI_API_KEY as string, // Cast to string; TypeScript won't automatically infer process.env types.
    });
    const prompt = ChatPromptTemplate.fromMessages([
        ['system', type === 'suggest' ? systemPromptSuggest : systemPromptExplain],
        ['user', userPrompt],
    ]);
    const chain = prompt.pipe(chatModel);
    const response = yield chain.invoke({ input });
    // const response: any = await chain.invoke({ content: 'what is the ram on this pc?' })
    return response.content;
});
export const getCommandByIndex = (commands, choice) => {
    // If choice is numeric, return commands[+choice - 1]
    // If choice is a letter, return that letter
    if (!isNaN(parseInt(choice))) {
        return {
            command: 'execute',
            explanation: null,
            index: parseInt(choice)
        };
    }
    const index = parseInt(choice);
    if (index > commands.length) {
        console.log('Invalid choice');
        process.exit(1);
    }
    return commands[index - 1];
};
export const showCommands = (question) => __awaiter(void 0, void 0, void 0, function* () {
    let currOperation = 'run';
    const t1 = (new Date()).valueOf();
    const response = yield getCommands('suggest', question);
    const t2 = (new Date()).valueOf();
    console.log(blue(`[${(t2 - t1) / 1000} s]`));
    // get the user to enter a question from the terminal
    const commands = response.split('===').map(x => x.trim()).filter(x => x).map(c => ({
        command: c,
        explanation: null
    }));
    // Go off and get the explanations for the commands
    Promise.all(commands.map((command) => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield getCommands('explain', [
            `Hi Jeff, I asked you this question: `,
            `Question: "${question}"`,
            `You provided me with this command.`,
            `${command.command}`,
            `Please explain what it does: `,
            ''
        ].join('\n'));
        command.explanation = response;
    })));
    console.log(yellow('Proposed solutions:'));
    commands.forEach((command, i) => {
        const cmd = command.command.split('\n').filter(x => x.trim());
        if (cmd.length > 1) {
            console.log(`  ${cyan(`${i + 1}:`)}`);
            cmd.forEach((line, i) => {
                if (i === 0) {
                    console.log(`   ${cyan(':')} ${line}`);
                }
                else {
                    console.log(`   ${cyan(':')} ${line}`);
                }
            });
        }
        else {
            console.log(`  ${cyan(`${i + 1}:`)} ${cmd}`);
        }
    });
    if (commands.length === 0) {
        console.log('No suggestion?! ');
        process.exit(1);
    }
    else {
        console.log('');
        const makeOpt = (label) => {
            // make label yellow with any uppercase letters cyan
            return label.split('').map((x) => x === x.toUpperCase() ? cyan(x) : x).join('');
        };
        const opts = ['eXplain', 'Run', 'Edit', 'Quit']
            .filter((x) => x.toLowerCase() !== currOperation)
            .map(makeOpt)
            .join('/');
        process.stdout.write(yellow(`[${opts}] Command to ${blue(currOperation)} ${cyan('#')}: `));
    }
    return commands;
});
