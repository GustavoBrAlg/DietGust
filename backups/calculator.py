import tkinter as tk
from tkinter import messagebox
import re
import math

class PremiumCalculator:
    def __init__(self, root):
        self.root = root
        self.root.title("Calculadora Premium")
        self.root.configure(bg="#17171c")
        
        # Dimensions
        self.base_width = 360
        self.extended_width = 600
        self.height = 580
        self.root.geometry(f"{self.base_width}x{self.height}")
        self.root.resizable(False, False)
        
        # Application state
        self.expression = ""
        self.result_shown = False
        self.history = []
        self.history_visible = False
        
        # Setup modern styles and widgets
        self.setup_ui()
        self.setup_bindings()
        
    def setup_ui(self):
        # Outer Container
        self.main_container = tk.Frame(self.root, bg="#17171c")
        self.main_container.pack(fill=tk.BOTH, expand=True)
        
        # Left side: Calculator panel
        self.calc_panel = tk.Frame(self.main_container, bg="#17171c", width=self.base_width)
        self.calc_panel.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self.calc_panel.pack_propagate(False)
        
        # Right side: History panel (initially hidden)
        self.history_panel = tk.Frame(self.main_container, bg="#22222b", width=240)
        
        # Header / Top bar in calculator
        self.header_frame = tk.Frame(self.calc_panel, bg="#17171c", height=40)
        self.header_frame.pack(fill=tk.X, padx=15, pady=(10, 5))
        
        self.title_label = tk.Label(
            self.header_frame, text="Calculadora", font=("Segoe UI", 12, "bold"),
            bg="#17171c", fg="#8e8e93"
        )
        self.title_label.pack(side=tk.LEFT)
        
        self.history_btn = tk.Button(
            self.header_frame, text="🕒 Histórico", font=("Segoe UI", 9),
            bg="#2c2c35", fg="#ffffff", activebackground="#3d3d4a", activeforeground="#ffffff",
            bd=0, relief="flat", padx=8, pady=2, cursor="hand2", command=self.toggle_history
        )
        self.history_btn.pack(side=tk.RIGHT)
        self.bind_hover(self.history_btn, "#2c2c35", "#3d3d4a")
        
        # Screen / Display Area
        self.display_frame = tk.Frame(self.calc_panel, bg="#17171c", height=130)
        self.display_frame.pack(fill=tk.X, padx=15, pady=(5, 10))
        self.display_frame.pack_propagate(False)
        
        # Formula / Equation display
        self.formula_var = tk.StringVar(value="")
        self.formula_label = tk.Label(
            self.display_frame, textvariable=self.formula_var, font=("Segoe UI", 11),
            bg="#17171c", fg="#8e8e93", anchor="e"
        )
        self.formula_label.pack(fill=tk.X, pady=(10, 2))
        
        # Current Value / Result display
        self.display_var = tk.StringVar(value="0")
        self.display_label = tk.Label(
            self.display_frame, textvariable=self.display_var, font=("Segoe UI", 28, "bold"),
            bg="#17171c", fg="#ffffff", anchor="e"
        )
        self.display_label.pack(fill=tk.X, pady=(2, 10))
        
        # Keypad Grid Frame
        self.keypad_frame = tk.Frame(self.calc_panel, bg="#17171c")
        self.keypad_frame.pack(fill=tk.BOTH, expand=True, padx=15, pady=(0, 15))
        
        # Configure grid columns and rows to expand evenly
        for i in range(4):
            self.keypad_frame.columnconfigure(i, weight=1)
        for i in range(6):
            self.keypad_frame.rowconfigure(i, weight=1)
            
        # Button layout definition: (Text, Row, Col, Type, Command)
        # Types: 'num' (numbers), 'op' (operators), 'fn' (functions), 'eq' (equals)
        buttons = [
            ("C", 0, 0, "fn", self.clear_all),
            ("(", 0, 1, "fn", lambda: self.press_operator("(")),
            (")", 0, 2, "fn", lambda: self.press_operator(")")),
            ("⌫", 0, 3, "fn", self.backspace),
            
            ("√", 1, 0, "fn", lambda: self.modify_last_number(math.sqrt)),
            ("x²", 1, 1, "fn", lambda: self.modify_last_number(lambda x: x**2)),
            ("%", 1, 2, "fn", lambda: self.modify_last_number(lambda x: x / 100.0)),
            ("÷", 1, 3, "op", lambda: self.press_operator("/")),
            
            ("7", 2, 0, "num", lambda: self.press_number("7")),
            ("8", 2, 1, "num", lambda: self.press_number("8")),
            ("9", 2, 2, "num", lambda: self.press_number("9")),
            ("×", 2, 3, "op", lambda: self.press_operator("*")),
            
            ("4", 3, 0, "num", lambda: self.press_number("4")),
            ("5", 3, 1, "num", lambda: self.press_number("5")),
            ("6", 3, 2, "num", lambda: self.press_number("6")),
            ("-", 3, 3, "op", lambda: self.press_operator("-")),
            
            ("1", 4, 0, "num", lambda: self.press_number("1")),
            ("2", 4, 1, "num", lambda: self.press_number("2")),
            ("3", 4, 2, "num", lambda: self.press_number("3")),
            ("+", 4, 3, "op", lambda: self.press_operator("+")),
            
            ("+/-", 5, 0, "num", lambda: self.modify_last_number(lambda x: -x)),
            ("0", 5, 1, "num", lambda: self.press_number("0")),
            (".", 5, 2, "num", self.press_decimal),
            ("=", 5, 3, "eq", self.calculate)
        ]
        
        # Color palettes per button type
        self.colors = {
            "num": {"bg": "#2c2c35", "fg": "#ffffff", "hover": "#3d3d4a"},
            "op": {"bg": "#3d3d4a", "fg": "#0a84ff", "hover": "#4e4e5f"},
            "fn": {"bg": "#2c2c35", "fg": "#a2a2a7", "hover": "#3d3d4a"},
            "eq": {"bg": "#0a84ff", "fg": "#ffffff", "hover": "#3099ff"}
        }
        
        # Create buttons
        for text, row, col, b_type, cmd in buttons:
            cfg = self.colors[b_type]
            btn = tk.Button(
                self.keypad_frame, text=text, font=("Segoe UI", 13, "bold" if b_type=="eq" else "normal"),
                bg=cfg["bg"], fg=cfg["fg"], activebackground=cfg["hover"], activeforeground=cfg["fg"],
                bd=0, relief="flat", cursor="hand2", command=cmd
            )
            # Add grid spacing for gap effect
            btn.grid(row=row, column=col, sticky="nsew", padx=3, pady=3)
            self.bind_hover(btn, cfg["bg"], cfg["hover"])
            
        # Setup History Panel widgets
        self.setup_history_panel()
        
    def setup_history_panel(self):
        # Header inside History panel
        hist_header = tk.Frame(self.history_panel, bg="#22222b", height=40)
        hist_header.pack(fill=tk.X, padx=10, pady=(10, 5))
        
        hist_title = tk.Label(
            hist_header, text="Histórico de Cálculos", font=("Segoe UI", 10, "bold"),
            bg="#22222b", fg="#ffffff"
        )
        hist_title.pack(side=tk.LEFT)
        
        clear_hist_btn = tk.Button(
            hist_header, text="Limpar", font=("Segoe UI", 8),
            bg="#2c2c35", fg="#ff453a", activebackground="#3d3d4a", activeforeground="#ff453a",
            bd=0, relief="flat", padx=6, pady=1, cursor="hand2", command=self.clear_history
        )
        clear_hist_btn.pack(side=tk.RIGHT)
        self.bind_hover(clear_hist_btn, "#2c2c35", "#3d3d4a")
        
        # History list frame with custom Scrollbar
        hist_list_frame = tk.Frame(self.history_panel, bg="#22222b")
        hist_list_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=(5, 10))
        
        scrollbar = tk.Scrollbar(hist_list_frame, orient=tk.VERTICAL)
        
        self.history_listbox = tk.Listbox(
            hist_list_frame, yscrollcommand=scrollbar.set, font=("Segoe UI", 9),
            bg="#1c1c24", fg="#ffffff", selectbackground="#3d3d4a", selectforeground="#ffffff",
            bd=0, highlightthickness=0, activestyle="none"
        )
        
        scrollbar.config(command=self.history_listbox.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.history_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        # Double click to restore equation/result
        self.history_listbox.bind("<Double-Button-1>", self.restore_history_item)
        
    def bind_hover(self, widget, normal_bg, hover_bg):
        widget.bind("<Enter>", lambda e: widget.config(bg=hover_bg))
        widget.bind("<Leave>", lambda e: widget.config(bg=normal_bg))
        
    def setup_bindings(self):
        # Keyboard supports
        self.root.bind("<Key>", self.handle_keyboard)
        # Focus window explicitly to capture keys
        self.root.focus_set()
        
    def handle_keyboard(self, event):
        char = event.char
        keysym = event.keysym
        
        if char in "0123456789":
            self.press_number(char)
        elif char in "+-*/":
            self.press_operator(char)
        elif char == ".":
            self.press_decimal()
        elif char in "()":
            self.press_operator(char)
        elif keysym in ("Return", "equal"):
            self.calculate()
        elif keysym == "BackSpace":
            self.backspace()
        elif keysym == "Escape":
            self.clear_all()
        elif char in ("c", "C"):
            self.clear_all()
        elif char == "%":
            self.modify_last_number(lambda x: x / 100.0)
            
    def press_number(self, num):
        if self.result_shown:
            self.expression = num
            self.result_shown = False
        else:
            # Prevent appending numbers right after a closing parenthesis without operator
            # (e.g. converting '(5)3' into ' (5) * 3' or just appending)
            # Let's keep it simple: if expression ends with ')', insert '*' automatically
            if self.expression.endswith(")"):
                self.expression += " * "
            self.expression += num
        self.update_display()
        
    def press_operator(self, op):
        if not self.expression and op in ("*", "/", ")"):
            # Avoid invalid starts
            return
            
        if self.result_shown:
            # Continue calculations from the result
            current_val = self.display_var.get()
            if current_val not in ("Erro", "Divisão por zero"):
                if current_val.startswith("-"):
                    self.expression = f"({current_val}) {op} "
                else:
                    self.expression = f"{current_val} {op} "
            else:
                self.expression = f"0 {op} "
            self.result_shown = False
        else:
            # If the user presses an operator after another operator, replace it
            # e.g., "12 + " then pressing "*" changes to "12 * "
            expr_stripped = self.expression.strip()
            if expr_stripped and expr_stripped[-1] in ("+", "-", "*", "/"):
                # Make sure it's not a unary negative sign inside parens, e.g. "(-"
                if not expr_stripped.endswith("(-"):
                    self.expression = expr_stripped[:-1] + f"{op} "
                    self.update_display()
                    return
                    
            if op in ("+", "-", "*", "/"):
                self.expression += f" {op} "
            else:
                # Parentheses
                self.expression += op
                
        self.update_display()
        
    def press_decimal(self):
        if self.result_shown:
            self.expression = "0."
            self.result_shown = False
            self.update_display()
            return
            
        # Verify if the last number already has a decimal point
        expr = self.expression.strip()
        pattern = r'(\d+\.?\d*)$'
        match = re.search(pattern, expr)
        if match:
            # If last part is a number and doesn't contain a dot
            if "." not in match.group(1):
                self.expression += "."
        elif not expr or expr[-1] in ("+", "-", "*", "/", "("):
            self.expression += "0."
            
        self.update_display()
        
    def backspace(self):
        if self.result_shown:
            self.clear_all()
            return
            
        if not self.expression:
            return
            
        # If expression ends with an operator with spaces, delete all 3 chars (e.g. " + ")
        if self.expression.endswith(" "):
            self.expression = self.expression[:-3]
        else:
            self.expression = self.expression[:-1]
            
        self.update_display()
        
    def clear_all(self):
        self.expression = ""
        self.formula_var.set("")
        self.display_var.set("0")
        self.result_shown = False
        
    def modify_last_number(self, operation):
        # Applies a unary mathematical operation to the last number in the expression
        expr = self.expression.strip()
        if not expr:
            # If empty, default to applying on 0
            expr = "0"
            
        if self.result_shown:
            try:
                val = float(self.display_var.get())
                new_val = operation(val)
                if new_val.is_integer():
                    new_val_str = str(int(new_val))
                else:
                    new_val_str = f"{new_val:.10g}"
                
                if new_val < 0:
                    self.expression = f"({new_val_str})"
                else:
                    self.expression = new_val_str
                    
                self.display_var.set(new_val_str)
                self.result_shown = False
                return
            except ValueError:
                self.display_var.set("Erro")
                return
            except ZeroDivisionError:
                self.display_var.set("Divisão por zero")
                return
            except Exception:
                self.display_var.set("Erro")
                return

        # Pattern to capture last number (normal or inside negation parens)
        pattern = r'(\((-\d+\.?\d*)\)|(\d+\.?\d*))$'
        match = re.search(pattern, expr)
        if match:
            full_match = match.group(0)
            val_str = match.group(2) if match.group(2) else match.group(3)
            try:
                val = float(val_str)
                new_val = operation(val)
                
                # Check for nan/inf
                if math.isnan(new_val) or math.isinf(new_val):
                    raise ValueError
                    
                if new_val.is_integer():
                    new_val_str = str(int(new_val))
                else:
                    new_val_str = f"{new_val:.10g}"
                
                if new_val < 0:
                    replacement = f"({new_val_str})"
                else:
                    replacement = new_val_str
                
                start_idx = match.start()
                self.expression = expr[:start_idx] + replacement
                self.update_display()
            except ValueError:
                self.display_var.set("Erro")
                self.result_shown = True
            except ZeroDivisionError:
                self.display_var.set("Divisão por zero")
                self.result_shown = True
            except Exception:
                self.display_var.set("Erro")
                self.result_shown = True
                
    def calculate(self):
        if not self.expression:
            return
            
        formula = self.expression.strip()
        
        # Pre-process formula for python evaluation
        # Replace division and multiplication symbols if necessary (our code uses standard keyboard operators internally)
        eval_formula = formula
        
        try:
            # Safe evaluation: only allow digits, operators, math functions (we check input keys, but let's double check)
            # Replace expressions to match Python syntax (e.g. bracket counts match, etc.)
            # If there's unmatched open parenthesis, close them automatically for convenience
            open_parens = eval_formula.count("(")
            close_parens = eval_formula.count(")")
            if open_parens > close_parens:
                eval_formula += ")" * (open_parens - close_parens)
                
            # Perform evaluation using a safe subset of globals/locals
            # Use float or int formatting
            result = eval(eval_formula, {"__builtins__": None}, {"math": math})
            
            # Format output
            if isinstance(result, (int, float)):
                if isinstance(result, float) and result.is_integer():
                    formatted_result = str(int(result))
                elif isinstance(result, float):
                    formatted_result = f"{result:.10g}"
                else:
                    formatted_result = str(result)
            else:
                formatted_result = str(result)
                
            # Update Displays
            self.formula_var.set(eval_formula + " =")
            self.display_var.set(formatted_result)
            
            # Save to history
            history_item = f"{eval_formula} = {formatted_result}"
            self.history.append((eval_formula, formatted_result))
            self.history_listbox.insert(tk.END, history_item)
            self.history_listbox.see(tk.END) # Auto scroll to end
            
            # Update state
            self.expression = formatted_result
            self.result_shown = True
            
        except ZeroDivisionError:
            self.display_var.set("Divisão por zero")
            self.result_shown = True
        except Exception:
            self.display_var.set("Erro")
            self.result_shown = True
            
    def update_display(self):
        # Maps internal characters to pretty display symbols
        pretty_expr = self.expression
        pretty_expr = pretty_expr.replace("*", "×").replace("/", "÷")
        
        # Limit length of display text or scroll
        if len(pretty_expr) > 20:
            # Show end of string
            self.formula_var.set("..." + pretty_expr[-20:])
        else:
            self.formula_var.set(pretty_expr)
            
        # Display current typed number or operator
        # Split expression and get last item
        parts = self.expression.strip().split()
        if not parts:
            self.display_var.set("0")
        else:
            last_part = parts[-1]
            # If last part is an operator, just show the current running expression
            if last_part in ("+", "-", "*", "/"):
                self.display_var.set(last_part.replace("*", "×").replace("/", "÷"))
            else:
                # If last part is a number wrapped in parenthesis, e.g. (-5), format it
                if last_part.startswith("(") and last_part.endswith(")"):
                    last_part = last_part[1:-1]
                self.display_var.set(last_part.replace("*", "×").replace("/", "÷"))
                
    def toggle_history(self):
        if self.history_visible:
            # Hide history panel
            self.history_panel.pack_forget()
            self.root.geometry(f"{self.base_width}x{self.height}")
            self.history_visible = False
            self.history_btn.config(bg="#2c2c35", fg="#ffffff")
        else:
            # Show history panel
            self.history_panel.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)
            self.root.geometry(f"{self.extended_width}x{self.height}")
            self.history_visible = True
            # Update colors to show toggled state
            self.history_btn.config(bg="#0a84ff", fg="#ffffff")
            
    def clear_history(self):
        self.history = []
        self.history_listbox.delete(0, tk.END)
        
    def restore_history_item(self, event):
        # Get selected item
        selection = self.history_listbox.curselection()
        if selection:
            idx = selection[0]
            formula, result = self.history[idx]
            # Restore formula and result
            self.expression = formula
            self.formula_var.set(formula)
            self.display_var.set(result)
            self.result_shown = False
            
if __name__ == "__main__":
    root = tk.Tk()
    app = PremiumCalculator(root)
    root.mainloop()
