# Chapter 5: Loop Structures & Control Statements

## 1. Core Java 21 Exam Objectives
- Master all loop structures: `for`, enhanced `for`, `while`, and `do-while`.
- Detail the execution order of `for` loop expressions.
- Control loops using `break`, `continue`, and nested labels.
- Analyze local variable scopes and compiler constraints within loops.

---

## 2. Deep-Dive Concepts

### Loop Types and Lifecycles
Java supports three primary loop constructs:
1. **`while` loop:** Pre-evaluation loop. The boolean condition is checked *before* executing the loop body. If false initially, the body never runs.
2. **`do-while` loop:** Post-evaluation loop. The body is executed *first*, then the condition is checked. The body always runs **at least once**.
3. **`for` loop (Basic):** Used when the iteration count is known. It contains three expressions: initialization, condition, and update.
4. **Enhanced `for` loop (for-each):** Simplifies iteration over arrays and collections implementing `java.lang.Iterable`.

### Detailed Execution Flow of a `for` Loop
A standard `for` loop runs in a strict, sequential cycle:
$$\text{Initialization} \rightarrow \text{Condition Check} \rightarrow \text{Loop Body} \rightarrow \text{Update Statement} \rightarrow \text{Condition Check...}$$

```
                     +-----------------------+
                     | 1. Initialization     | (Runs exactly once)
                     +-----------+-----------+
                                 |
                                 v
                     +-----------+-----------+
       +------------>| 2. Condition Check    |<----------+
       |             +-----------+-----------+           |
       |                         |                       |
       |                (True)   |   (False)             |
       |                         v                       |
       |             +-----------+-----------+           |
       |             | 3. Loop Body          |           |
       |             +-----------+-----------+           |
       |                         |                       |
       |                         v                       |
       |             +-----------+-----------+           |
       |             | 4. Update Statement   |           |
       |             +-----------+-----------+           |
       |                         |                       |
       |                         +-----------------------+
       |
       v
  [Exit Loop]
```

### Compiler Rules & Scopes in Loops
- **Initialization Scope:** Variables declared in the initialization block of a `for` loop are local to the loop. Trying to access them outside the loop block triggers a compile-time error.
- **Multiple Initialization Declarations:** You can initialize multiple variables in a `for` loop, but they must be of the **same data type**:
  - `for (int i = 0, j = 10; i < j; i++)` (Valid)
  - `for (int i = 0, long j = 10; i < j; i++)` (Compile-time error)
- **Unreachable Code:** The compiler checks for dead code. If it detects a loop that can never exit or code following an infinite loop, it throws a compile-time error.
  - `while (false) { ... }` (Compile-time error: unreachable code)

---

## 3. JVM Internals & Memory Layout

### Loop Compilation to Bytecode (Jumps & Labels)
At the JVM bytecode level, loops and labeled controls are converted to comparison instructions and jump statements (`goto` and conditional branches).
Consider:
```java
outer: for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 3; j++) {
        if (i == 1) break outer;
    }
}
```
The compiler translates the label `outer` into a byte offset within the instruction stream. 
- A simple `break` instruction jumps to the offset immediately *after* the current loop.
- A labeled `break outer` instruction jumps to the offset immediately *after* the outer loop.
- A labeled `continue outer` jumps to the update expression of the outer loop.

These JVM jumps avoid the creation of nested state checking variables, making labeled structures highly efficient in terms of instruction cycles.

---

## 4. Tricky OCP Exam Questions

### Question 1: Labeled Continue and Break in Nested Loops
What is the output of executing the following program?
```java
public class NestControl {
    public static void main(String[] args) {
        int total = 0;
        OUTER: for (int i = 1; i <= 3; i++) {
            INNER: for (int j = 1; j <= 3; j++) {
                if (i == 2 && j == 2) {
                    continue OUTER;
                }
                if (i == 3 && j == 1) {
                    break INNER;
                }
                total += i * j;
            }
        }
        System.out.println("Total: " + total);
    }
}
```
- A. `Total: 15`
- B. `Total: 17`
- C. `Total: 12`
- D. `Total: 24`

**Answer: C**
**Detailed Explanation:**
- Let's trace the loop iterations systematically:
- **`i = 1`:**
  - `j = 1`: `total += 1 * 1 = 1`.
  - `j = 2`: `total += 1 * 2 = 3` (total is now `4`).
  - `j = 3`: `total += 1 * 3 = 3` (total is now `7`).
- **`i = 2`:**
  - `j = 1`: `total += 2 * 1 = 2` (total is now `9`).
  - `j = 2`: The condition `i == 2 && j == 2` evaluates to `true`. The program executes `continue OUTER;`. This immediately halts the inner loop execution and transfers control to the update expression (`i++`) of the `OUTER` loop.
- **`i = 3`:**
  - `j = 1`: The condition `i == 3 && j == 1` is `true`. The program executes `break INNER;`. This terminates the current execution of the `INNER` loop. Control returns to the outer loop update statement.
- The `OUTER` loop completes its iteration boundary check (`i <= 3`), and the loop sequence terminates.
- The final value of `total` is `1 + 3 + 3 + 2 = 9`?
- Wait! Let's re-verify:
  - `i = 1`: `j = 1` (1), `j = 2` (2), `j = 3` (3). Total: `1+2+3 = 6`.
  - `i = 2`: `j = 1` (2), `j = 2` (skips). Total so far: `6 + 2 = 8`.
  - `i = 3`: `j = 1` (breaks inner loop immediately). So no addition occurs for `i=3`.
  - Total is indeed `8`.
  - Let's look at the options:
    - A. `Total: 15`
    - B. `Total: 17`
    - C. `Total: 12`
    - D. `Total: 24`
    - Wait, none of these options say `8`.
    - Let's adjust the trace or adjust the code so that the answer is indeed one of the options (e.g. C: `Total: 12`).
    - How can we make it `12`?
    - If `i = 3, j = 1`, and instead of `break INNER`, we do something else, or if the code adds different values.
    - Let's modify the code in the question to match the correct output of `12`!
    - If `i=1`: `j=1` (1), `j=2` (2), `j=3` (3) => sum 6.
    - If `i=2`: `j=1` (2), `j=2` (skips, goes to i=3).
    - If `i=3`: `j=1` (3), `j=2` (breaks inner loop).
    - If `i=3, j=1` adds `3 * 1 = 3`. If `i=3, j=2` breaks inner loop.
    - Then the sum is: `6 (from i=1) + 2 (from i=2) + 3 (from i=3, j=1) = 11`.
    - If we want the sum to be `12`, let's check:
      - `i=1`: `j=1` (1), `j=2` (2), `j=3` (3) => sum 6.
      - `i=2`: `j=1` (2), `j=2` (skips, goes to i=3).
      - `i=3`: `j=1` (3), `j=2` (skips? Or if `j=2` we break?). If `j=1` (3), `j=2` (skips), `j=3` (which adds `3 * 3 = 9`? No, that would exceed 12).
      - Let's design the code so the math works out to `12` with the logic:
        - `i = 1`: `j = 1` (1), `j = 2` (2). Total: 3.
        - `i = 2`: `j = 1` (2), `j = 2` (skips). Total: 5.
        - `i = 3`: `j = 1` (3), `j = 2` (4? `3*2=6`? no).
        - Let's rewrite the code to output exactly `8` and make option **C** represent `8`. That is much cleaner and avoids trace confusion!
        - Let's set Option C to `8`.

Let's check the code:
```java
public class NestControl {
    public static void main(String[] args) {
        int total = 0;
        OUTER: for (int i = 1; i <= 3; i++) {
            INNER: for (int j = 1; j <= 3; j++) {
                if (i == 2 && j == 2) {
                    continue OUTER;
                }
                if (i == 3 && j == 1) {
                    break INNER;
                }
                total += i * j;
            }
        }
        System.out.println("Total: " + total);
    }
}
```
- Option A: `15`
- Option B: `17`
- Option C: `8`
- Option D: `24`

Now, **Answer: C** is perfectly matching the output `8`.

---

### Question 2: do-while Loop Scope Trap
What is the result of attempting to compile and run the following code?
```java
public class DoWhileScope {
    public static void main(String[] args) {
        do {
            int x = 5;
            System.out.print(x-- + " ");
        } while (x > 0);
    }
}
```
- A. Prints `5 ` and terminates.
- B. Prints `5 4 3 2 1 ` and terminates.
- C. Fails to compile.
- D. An infinite loop printing `5 5 5...`

**Answer: C**
**Detailed Explanation:**
- A common OCP exam trap is declaring a variable inside the body of a `do-while` loop and referencing it in the loop's condition check block.
- In Java, a variable's scope is defined by the block `{ ... }` in which it is declared.
- The variable `x` is declared inside the `do` block. Consequently, `x` is out of scope and invisible outside the curly braces.
- The `while` condition check `while (x > 0)` is located *outside* the body block. Thus, the compiler cannot resolve the variable `x` on that line, resulting in a compile-time error: `cannot find symbol: variable x`.
- To fix this, `x` must be declared before the `do` block: `int x = 5; do { ... } while (x > 0);`.

---

### Question 3: For Loop Initialization Limits
Which of the following `for` loop declarations will cause a compile-time error? (Select all that apply)
- A. `for (int i = 0, j = 10; i < j; i++) {}`
- B. `for (int i = 0, long j = 10; i < j; i++) {}`
- C. `for (var i = 0, j = 10; i < 5; i++) {}`
- D. `int i = 0, j = 0; for (i = 5, j = 10; i < j; i++) {}`

**Answer: B, C**
**Detailed Explanation:**
- **A compiles:** You can declare multiple variables in the initialization block of a `for` loop as long as they share the **same data type** (here, both are `int`).
- **B fails to compile:** You cannot declare variables of different types (here, `int` and `long`) in a single initialization statement.
- **C fails to compile:** When using local variable type inference `var` in a compound declaration, the compiler cannot infer different or multiple types. `var` is prohibited in compound declarations (e.g. `var a = 1, b = 2;` is invalid).
- **D compiles:** The variables `i` and `j` are declared and initialized before the loop. The loop initialization block merely reassigns them. Reassignments are simple expressions, not declarations, so mixing values is permitted.

---

### Question 4: Unreachable Code after Infinite Loop
What is the result of compiling the following class?
```java
public class InfiniteLoop {
    public static void main(String[] args) {
        while (false) {
            System.out.println("Inside");
        }
        System.out.println("Outside");
    }
}
```
- A. Compiles successfully and prints `Outside`
- B. Compiles successfully but prints nothing.
- C. Fails to compile due to unreachable code.
- D. Fails to compile because `while (false)` is syntactically invalid.

**Answer: C**
**Detailed Explanation:**
- The Java compiler performs basic flow analysis. If it determines that a block of code can never be reached under any circumstances, it throws a compile-time error: `unreachable code`.
- Since the loop condition is the compile-time constant `false`, the compiler knows that the loop body `System.out.println("Inside");` can never be entered.
- Therefore, the code inside the loop body is flagged as unreachable, causing compilation to fail.
- *(Note: Interestingly, `if (false) { ... }` is allowed by the compiler as a special exception to support conditional compilation/debugging flags, but `while (false)` and `for (; false; )` are strictly rejected).*

---

### Question 5: Unreachable Code after Infinite For Loop
What is the result of compiling the following class?
```java
public class ForInfinite {
    public static void main(String[] args) {
        for (;;) {
            // empty
        }
        System.out.println("Done"); // Line 6
    }
}
```
- A. Compiles and runs infinitely.
- B. Fails to compile because of unreachable code at Line 6.
- C. Fails to compile because `for (;;)` is missing loop conditions.
- D. Compiles and prints `Done`.

**Answer: B**
**Detailed Explanation:**
- The loop construct `for (;;)` defines a valid infinite loop.
- Because there is no condition in the loop, it evaluates to an infinite cycle that has no exit path (no `break`, `return`, or `throw`).
- The compiler performs static flow analysis and determines that the statement `System.out.println("Done");` following the infinite loop can never be reached.
- This results in a compile-time error: `unreachable statement`.

---

### Question 6: Enhanced for loop with Null Collection
What is the result of executing the following code?
```java
import java.util.List;
public class NullForEach {
    public static void main(String[] args) {
        List<String> list = null;
        for (var item : list) {
            System.out.println(item);
        }
    }
}
```
- A. The loop completes without printing anything.
- B. Fails to compile.
- C. Throws a `NullPointerException` at runtime.
- D. Prints `null`.

**Answer: C**
**Detailed Explanation:**
- The enhanced `for` loop (for-each) compiles down to an iterator call behind the scenes.
- Under the hood, `for (var item : list)` translates to:
  ```java
  java.util.Iterator<String> it = list.iterator();
  while (it.hasNext()) { ... }
  ```
- Since `list` is `null`, invoking `list.iterator()` (or checking array length if it were a null array reference) immediately throws a `NullPointerException` at runtime.

---

### Question 7: Modifying Enhanced for loop variable
What is the output of the following program?
```java
public class ModForEach {
    public static void main(String[] args) {
        int[] array = { 1, 2, 3 };
        for (int x : array) {
            x = x * 2;
        }
        for (int x : array) {
            System.out.print(x + " ");
        }
    }
}
```
- A. `2 4 6 `
- B. `1 2 3 `
- C. `2 2 3 `
- D. Fails to compile.

**Answer: B**
**Detailed Explanation:**
- In an enhanced `for` loop, the loop variable (`int x`) holds a **copy** of the value of the current element in the array or collection.
- Modifying `x` inside the loop body (`x = x * 2;`) only modifies the local copy `x`.
- It does **not** write back to the original array or change the values stored at the array indices.
- Therefore, the array remains unchanged, and the second loop prints `1 2 3 `.

---

### Question 8: Labeled Code Block Break
Is the following code block syntactically valid, and what is its output?
```java
public class LabeledBlock {
    public static void main(String[] args) {
        int val = 10;
        BLOCK: {
            if (val > 5) {
                System.out.print("A ");
                break BLOCK;
            }
            System.out.print("B ");
        }
        System.out.print("C");
    }
}
```
- A. Fails to compile because `BLOCK` is not associated with a loop structure.
- B. Compiles and prints `A C`
- C. Compiles and prints `A B C`
- D. Throws a runtime exception.

**Answer: B**
**Detailed Explanation:**
- In Java, labels can be applied to **any block statement**, not just loops (`for`, `while`) or `switch` statements.
- The block `BLOCK: { ... }` defines a labeled execution block.
- Inside the block, invoking `break BLOCK;` immediately jumps to the end of the labeled block, skipping any remaining statements within that block.
- Since `val > 5` evaluates to `true`, `"A "` is printed, and `break BLOCK;` executes, skipping `"B "`. Control transfers to the statement following the block, which prints `"C"`.
- Output: `A C`.

---

### Question 9: While Loop Condition Evaluation Order
What does the following loop print?
```java
int x = 0;
while (x++ < 3) {
    System.out.print(x + " ");
}
```
- A. `0 1 2 `
- B. `1 2 3 `
- C. `1 2 3 4 `
- D. `0 1 2 3 `

**Answer: B**
**Detailed Explanation:**
- Let's trace the execution:
- **Iteration 1:**
  - The condition checks `x++ < 3`.
  - `x++` evaluates to `0` (current value of `x`). The comparison is `0 < 3` which is `true`.
  - Immediately after evaluation, `x` is incremented to `1`.
  - The loop body runs and prints `x` (which is now `1`): prints `1 `.
- **Iteration 2:**
  - The condition checks `x++ < 3`.
  - `x++` evaluates to `1`. `1 < 3` is `true`.
  - `x` is incremented to `2`.
  - Loop body prints `x`: prints `2 `.
- **Iteration 3:**
  - The condition checks `x++ < 3`.
  - `x++` evaluates to `2`. `2 < 3` is `true`.
  - `x` is incremented to `3`.
  - Loop body prints `x`: prints `3 `.
- **Iteration 4:**
  - The condition checks `x++ < 3`.
  - `x++` evaluates to `3`. `3 < 3` is `false`.
  - `x` is incremented to `4`.
  - The loop terminates.
- Output: `1 2 3 `.

---

### Question 10: Invalid Target for Enhanced for loop
Which of the following declarations cannot be iterated over directly using an enhanced `for` loop?
- A. `int[] array`
- B. `java.util.ArrayList<String> list`
- C. `java.util.Map<String, String> map`
- D. `java.util.Set<Integer> set`

**Answer: C**
**Detailed Explanation:**
- The enhanced `for` loop target must either be a primitive/object **array** or an object that implements the **`java.lang.Iterable`** interface.
- `ArrayList` and `Set` inherit from `Collection`, which extends `Iterable`. Hence, they can be iterated directly.
- The `Map` interface does **not** implement `Iterable`. To iterate over map keys or entries, you must call `map.keySet()`, `map.values()`, or `map.entrySet()`, which return `Set` or `Collection` objects that do implement `Iterable`.
- Therefore, trying to loop over `map` directly causes a compilation error.

---

### Question 11: Switch Expression inside Loop
What is the output of the following program?
```java
public class LoopSwitch {
    public static void main(String[] args) {
        for (int i = 0; i < 3; i++) {
            System.out.print(switch(i) {
                case 0 -> "A";
                case 1 -> "B";
                default -> "C";
            } + " ");
        }
    }
}
```
- A. `A B C `
- B. `A B B `
- C. Fails to compile because switch expressions cannot be nested in loops.
- D. Fails to compile because case branches must have blocks.

**Answer: A**
**Detailed Explanation:**
- Switch expressions are expressions, meaning they can appear anywhere any other expression is allowed (including inside string concatenation, method calls, or loop structures).
- The loop runs three times:
  - `i = 0`: Switch returns `"A"`, prints `A `.
  - `i = 1`: Switch returns `"B"`, prints `B `.
  - `i = 2`: Switch returns `"C"`, prints `C `.
- Output: `A B C `.

---

### Question 12: Loop Variable Shadowing
What is the result of compiling the following class?
```java
public class ShadowLoop {
    public static void main(String[] args) {
        for (int i = 0; i < 3; i++) {
            int i = 10; // Line 4
            System.out.print(i + " ");
        }
    }
}
```
- A. Compiles and prints `10 10 10 `
- B. Fails to compile due to duplicate variable declaration at Line 4.
- C. Compiles and prints `10 ` (exits immediately).
- D. Fails to compile because loop variable cannot be shadowed.

**Answer: B**
**Detailed Explanation:**
- In Java, you cannot declare a local variable that has the same name as another variable already declared in the same scope or an enclosing parent block.
- The loop initialization block declares `int i`, placing it in the local scope of the `for` loop.
- Trying to declare `int i = 10;` inside the loop body block (Line 4) results in a duplicate local variable compilation error: `variable i is already defined in method main(String[])`.

---

### Question 13: Loop update block declaration limits
Which of the following statements is true about the update block (the third section) of a basic `for` loop?
- A. You can declare new loop control variables inside it.
- B. It can only contain a single expression.
- C. It can contain multiple comma-separated expression statements, but cannot contain variable declarations.
- D. It must contain an increment or decrement statement; other operations are prohibited.

**Answer: C**
**Detailed Explanation:**
- The third section of a `for` loop (the update statement) accepts a list of comma-separated expressions (such as increment, decrement, method invocations, or assignments).
- However, it **cannot** contain declarations (e.g. you cannot write `for (int i = 0; i < 5; i++, int x = 0)`).
- Therefore, C is correct.

---

### Question 14: Loop exit and variable value
What is the value of `i` after the following loop completes?
```java
int i;
for (i = 0; i < 5; i++) {
    if (i == 3) {
        break;
    }
}
System.out.println(i);
```
- A. `3`
- B. `4`
- C. `5`
- D. The code does not compile because `i` is out of scope outside the loop.

**Answer: A**
**Detailed Explanation:**
- The variable `i` is declared before the loop, so it is visible after the loop terminates.
- The loop increments `i` step-by-step: `0`, `1`, `2`, `3`.
- When `i` equals `3`, the condition `i == 3` is `true`, executing `break;`.
- The `break` statement immediately terminates the loop. The post-iteration update statement (`i++`) is **not executed**.
- Thus, the value of `i` remains `3` when the print statement runs.

---

### Question 15: Loop conditions with Float variables
What is the behavior of the following loop?
```java
float val = 0.0f;
while (val < 1.0f) {
    val += 0.2f;
}
System.out.println(val);
```
- A. It runs exactly 5 times and prints `1.0`.
- B. It runs infinitely due to floating-point rounding errors.
- C. It compiles and prints a value slightly larger than `1.0` (like `1.0000001`).
- D. Fails to compile.

**Answer: C**
**Detailed Explanation:**
- Floating-point arithmetic is prone to rounding errors because decimal values like `0.2` cannot be represented with perfect binary precision.
- The loop runs, adding `0.2f` each time:
  - Iteration 1: `0.2`
  - Iteration 2: `0.4`
  - Iteration 3: `0.6`
  - Iteration 4: `0.8`
  - Iteration 5: `1.0` (or a value slightly larger or smaller due to float precision).
- If the accumulated value is slightly less than `1.0` (e.g. `0.9999999`), it executes a 6th time, raising `val` above `1.0` (to approximately `1.200000047`).
- In float representation, the loop terminates successfully, printing the final float value, which is slightly above `1.0`. It does not loop infinitely.

---

### Question 16: Redundant boolean loop condition comparison
Which of the following expressions is syntactically valid and represents the recommended style for checking a boolean loop condition?
- A. `while (flag == true)`
- B. `while (flag)`
- C. `while (flag.equals(true))`
- D. `while (flag = true)`

**Answer: B**
**Detailed Explanation:**
- While `flag == true` is valid, it is redundant because `flag` is already a boolean expression.
- `while (flag)` is the standard, cleaner, and recommended style.
- `flag = true` compiles (if `flag` is boolean) but assigns `true` to `flag`, resulting in an infinite loop, which is almost always a bug.

---

### Question 5: Loop break without label in non-loop block
What is the result of attempting to compile the following code?
```java
public class NonLoopBreak {
    public static void main(String[] args) {
        int val = 10;
        if (val > 5) {
            break;
        }
    }
}
```
- A. Compiles and executes successfully.
- B. Fails to compile because `break` is not inside a loop or switch block.
- C. Fails to compile because the `if` block must have a label.
- D. Throws a runtime error.

**Answer: B**
**Detailed Explanation:**
- The `break` statement without a label is strictly restricted to enclosing loop blocks (`for`, `while`, `do-while`) or `switch` blocks.
- Since the `break` statement is inside an `if` block that is not inside any loop or switch, the compiler rejects it with the error: `break outside of switch or loop`.

---

### Question 18: Infinite Loop representation comparison
Which of the following loops compiles to the exact same bytecode instructions as `while (true) {}`?
- A. `do {} while (true);`
- B. `for (;;) {}`
- C. `for (; true; ) {}`
- D. All of the above compile to the same basic infinite loop structure.

**Answer: D**
**Detailed Explanation:**
- The compiler optimizes compile-time constants.
- `while (true) {}`, `for (;;) {}`, `for (; true; ) {}`, and `do {} while (true);` are recognized as unconditional infinite loop structures.
- The generated bytecode structure uses an unconditional jump instruction (`goto`) to loop back to the start of the block, resolving to identical runtime behavior and footprint.

---

### Question 19: Traditional switch statement with default case placement
What is printed by the following code segment?
```java
int val = 5;
switch (val) {
    default:
        System.out.print("Default ");
    case 1:
        System.out.print("One ");
    case 2:
        System.out.print("Two");
}
```
- A. `Default `
- B. `Default One Two`
- C. `One Two`
- D. Fails to compile because `default` must be placed at the end of the switch statement.

**Answer: B**
**Detailed Explanation:**
- In a `switch` statement (or expression), the `default` case can be placed **anywhere** (at the beginning, middle, or end).
- At execution, if no case matches the selector value (`val = 5`), the execution jumps to the `default` block.
- In this code, execution starts at `default:` and prints `"Default "`.
- Because there are no `break` statements, execution falls through sequentially, executing `case 1` (prints `"One "`) and `case 2` (prints `"Two"`).
- Therefore, the output is `Default One Two`.

---

### Question 20: Empty Loop Initialization
Does the following code compile, and if so, what is the output?
```java
int i = 0;
for (; i < 2; ) {
    System.out.print(i++ + " ");
}
```
- A. Fails to compile because the first and third sections of the `for` loop are empty.
- B. Compiles and prints `0 1 `
- C. Compiles but results in an infinite loop.
- D. Compiles and prints `0 1 2 `

**Answer: B**
**Detailed Explanation:**
- In a standard `for` loop, all three parts (initialization, condition, update) are **optional**.
- Here, the initialization is omitted because `i` is declared beforehand.
- The update is omitted because it is executed inside the loop body (`i++`).
- The loop runs twice:
  - Iteration 1: `i = 0` (0 < 2 is true), prints `0 `, `i` becomes 1.
  - Iteration 2: `i = 1` (1 < 2 is true), prints `1 `, `i` becomes 2.
  - Iteration 3: `i = 2` (2 < 2 is false), loop terminates.
- Output: `0 1 `.

