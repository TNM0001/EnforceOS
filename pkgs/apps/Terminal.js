export default {
  name: "Terminal",
  description: "Terminal for EnforceOS",
  ver: 1,
  type: "process",
  privileges: [
    {
      privilege: "startPkg",
      description: "Run applications",
    },
  ],
  exec: async function (Root) {
    let wrapper;
    let MyWindow;

    Root.Lib.setOnEnd(function() {
      MyWindow.close();
    });

    const L = Root.Lib;
    const C = Root.Core;

    const Win = (await Root.Lib.loadLibrary("WindowSystem")).win;
    const vfs = await L.loadLibrary("VirtualFS");
    const FileMappings = await L.loadLibrary("FileMappings");

    MyWindow = new Win({
      title: "Terminal",
      pid: Root.PID,
      width: 869,
      height: 500,
      onclose: () => {
        Root.Lib.onEnd();
      },
    });

    wrapper = MyWindow.window.querySelector(".win-content");

    const prevCommands = new Root.Lib.html("div")
      .class("terminal-prev-commands", "monospace")
      .appendTo(wrapper);

    const currentLine = new Root.Lib.html("div")
      .class("terminal-current-line")
      .appendTo(wrapper);

    const currentLineInput = new Root.Lib.html("input")
      .class("terminal-current-line-input")
      .attr({ placeholder: "Stuck? Run 'help'! (Enter key to run command)" })
      .appendTo(currentLine);

    currentLineInput.elm.focus();


    let path = "Root";

    currentLineInput.on("keydown", async (e) => {
      if (e.key === "Enter") {
        const command = currentLineInput.elm.value;

        await vfs.importFS();

        currentLineInput.elm.value = "";

        const commandDiv = new Root.Lib.html("div")
          .class("terminal-prev-command")
          .appendTo(prevCommands);

        new Root.Lib.html("span")
          .class("terminal-prev-command-text")
          .text(path + " > " + command)
          .appendTo(commandDiv);

        const commandOutput = new Root.Lib.html("span")
          .class("terminal-prev-command-output")
          .appendTo(commandDiv);

        const commandOutputText = new Root.Lib.html("span")
          .class("terminal-prev-command-output-text")
          .appendTo(commandOutput);


        const commands = {
          clear: () => {
            prevCommands.elm.innerHTML = "";
          },
          echo: (args) => {
            commandOutputText.text(args.join(" "));
          },
          ls: async (args) => {
            const files = await vfs.list(args[0] || path);
            console.log(files);

            commandOutputText.text(
              files
                .map((file) => {
                  return `${file.item} - ${file.type.toUpperCase()}`;
                })
                .join("\n")
            );
          },
          cat: async (args) => {
            const isFile = await vfs.whatIs(args[0] || path);
            if (isFile === "dir") {
              commandOutputText.text("Cannot cat a directory");
              return;
            }

            const file = await vfs.readFile(args[0] || path);

            console.log(file);

            commandOutputText.text(file);
          },
          cd: async (args) => {
            const isFile = await vfs.whatIs(path + "/" + args[0]);
            if (args[0] === "..") {
              // if the folder is Root then it will not go back
              if (path === "Root") {
                commandOutputText.text("Cannot cd back from Root");
              }
              // if the folder is not Root then it will go back
              else {
                // set the path var, to the old path then it adds a / before new path but remove the last slash
                path = path.split("/").slice(0, -1).join("/");
              }
              return;
            }

            if (isFile === "file") {
              commandOutputText.text("Cannot cd into a file");
              return;
            }

            if (!isFile) {
              commandOutputText.text("Path does not exist");
              return;
            }
            console.log(isFile);

            // set the path var, to the old path then it adds a / before new path but remove the last slash
            path = path + "/" + args[0];
          },
          process: async (args) => {
            const option = args[0];
            const name = args[1];

            if (!option)
              return commandOutputText.text(
                "Please specify an option (start | kill)"
              );

            if (!name)
              return commandOutputText.text("Please specify a name or pid");

            if (option === "start") {
              L.launch("apps:" + name.replace(/([^A-Za-z0-9-])/g, ""));
              commandOutputText.text(
                "Created the process " + name + " successfully"
              );
            } else if (option === "kill") {
              let p = C.processList
                .filter((p) => p !== null)
                .find((p) => p.pid === name);

              p.proc?.end();
            }
          },
          help: () => {
            const commands = [
              {
                name: "clear",
                description: "Clears the terminal",
                usage: "clear",
              },
              {
                name: "echo",
                description: "Prints the arguments",
                usage: "echo [args...]",
              },
              {
                name: "help",
                description: "Prints this help message",
                usage: "help",
              },
              {
                name: "ls",
                description: "Lists files and folders",
                usage: "ls [path]",
              },
              {
                name: "cat",
                description: "Prints the contents of a file",
                usage: "cat [path]",
              },
              {
                name: "cd",
                description: "Changes the current directory",
                usage: "cd [path]",
              },
              {
                name: "process",
                description: "Manages processes",
                usage: "process [start | kill] [name | pid]",
              },
            ];

            commandOutputText.text(
              commands
                .map(
                  (c) => `${c.name} - ${c.description}\nUsage: ${c.usage}\n\n`
                )
                .join("")
            );
          },
        };

        const args = command.split(" ");

        if (commands[args[0]]) {
          commands[args[0]](args.slice(1));
        } else {
          commandOutputText.text("Command not found");
        }


        prevCommands.elm.scrollTop = prevCommands.elm.scrollHeight;
      }
    });

    return Root.Lib.setupReturns((m) => {
      console.log("Example received message: " + m);
    });
  },
};
