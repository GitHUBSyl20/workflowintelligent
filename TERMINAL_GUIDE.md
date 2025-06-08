# Your New Supercharged Zsh Terminal: A Quick-Start Guide

Welcome to your upgraded terminal experience! This guide will walk you through the powerful new features you've just installed. They are ordered from most to least impactful to help you get up to speed quickly.

---

## 1. The "Big Three": Your New Superpowers

These features are always active and will fundamentally change how you interact with the command line.

### ⭐ Powerlevel10k: The Smartest Prompt in the World

Your command prompt is no longer just a `$` sign; it's a rich, context-aware dashboard.

- **Git Status, Instantly:** The most powerful feature. It shows your current branch, tells you if you have new files (`?`), modified files (`!`), or staged changes (`+`), and whether you are ahead of or behind the remote branch.
- **You Are Here:** Your current directory path is shown clearly.
- **Command Status:** The prompt arrow turns **green** for a successful last command and **red** for an error.
- **Customizable:** Don't like the look? Just run `p10k configure` anytime to go through the visual setup wizard again.

### ⭐ Zsh Autosuggestions: The Command Telepath

This is a massive time-saver.

- **How it works:** As you start typing a command, it suggests a completion based on your command history. The suggestion appears as a faint gray text.
- **To accept a suggestion:** Simply press the **Right Arrow key (`→`)** or **End key**.
- **To ignore:** Just keep typing as you normally would.

### ⭐ Zsh Syntax Highlighting: Your Pre-flight Check

This plugin tells you if your command is valid *before* you hit Enter.

- **Valid commands** will appear **green**.
- **Invalid commands** or typos will appear **red**.
- It helps you catch errors, especially missing quotes or typos in long commands, before they even run.

---

## 2. Productivity Power-Ups

These plugins require you to learn a few simple commands, but the payoff is huge.

### 🚀 `wd` (Warp Directory): Jump Between Projects

Forget long `cd ../../...` commands. `wd` lets you bookmark your favorite directories and "warp" to them from anywhere.

- **Add a warp point:** Navigate to a directory you visit often, then run:
  ```sh
  wd add .
  ```
- **List your points:**
  ```sh
sh
  wd list
  ```
- **Warp to a point:**
  ```sh
  wd <warp-point-name>
  ```
  *(Example: `wd sylvainmagana-website`)*

### 🚀 `git` Plugin: The Best Aliases

Oh My Zsh comes with a huge number of handy shortcuts for Git. You'll never type `git status` again. Here are the absolute essentials:

| Alias   | Full Command         | Description                            |
|---------|----------------------|----------------------------------------|
| `gst`   | `git status`         | Check your repository status.          |
| `gaa`   | `git add --all`      | Stage all new and modified files.      |
| `gcmsg` | `git commit -m "..."`| Commit staged files with a message.    |
| `gp`    | `git push`           | Push your commits to the remote.       |
| `gpull` | `git pull`           | Pull changes from the remote.          |
| `gco`   | `git checkout`       | Checkout a branch or file.             |
| `gb`    | `git branch`         | List, create, or delete branches.      |
| `gl`    | `git log --oneline --decorate --graph` | A much nicer log view. |

---

## 3. Tool-Specific Helpers

These plugins work in the background to make working with specific tools easier via tab-completion.

- **`docker` & `docker-compose`:** Type `docker` or `docker-compose` and press `<Tab>` to see available commands. It can also autocomplete container IDs, image names, and more.
- **`npm`:** Type `npm run` and press `<Tab>` to see a list of all the scripts available in your `package.json`.

---

## 4. Maintenance & Customization

### Keeping Up-to-Date

It's good practice to update your setup every few weeks to get the latest features and security fixes.

```sh
omz update
```
This single command will update Oh My Zsh, your theme, and all of your plugins.

### Making it Your Own: Custom Aliases

As you work, you'll find yourself typing the same long commands over and over. Turn them into aliases!

1.  Open your Zsh configuration file: `code /Users/Syl20/.zshrc`
2.  Scroll to the bottom of the file.
3.  Add your own aliases using this format:
    ```sh
    # My Custom Aliases
    alias update="omz update"
    alias myproject="cd /Users/Syl20/Desktop/FREELANCE/sylvainmagana-website"
    ```
4.  Save the file and open a new terminal to use them.

Enjoy your new terminal! 