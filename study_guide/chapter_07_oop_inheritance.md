# Chapter 7: OOP - Inheritance, Overriding & Shadowing

## 1. Core Java 21 Exam Objectives
- Apply inheritance rules using `extends` and implement interfaces.
- Master method overriding rules, covariant return types, and access restrictions.
- Differentiate between method overriding and method overloading.
- Understand Virtual Method Invocation (VMI).
- Differentiate polymorphic method calls from field shadowing.

---

## 2. Deep-Dive Concepts

### Method Overriding Rules (Highly Tested on OCP)
An overriding method in a subclass must satisfy five strict compiler checks:
1. **Name and Arguments:** Must have the exact same signature (name and parameter list).
2. **Access Modifier:** Cannot be more restrictive than the parent method.
   - If parent is `protected`, child can be `protected` or `public` (but not package-private or `private`).
3. **Return Type:** Must be the same type or a **covariant return type** (a subclass of the parent return type).
4. **Checked Exceptions:** Cannot declare new or broader *checked* exceptions. It can declare the same checked exceptions, narrower exceptions, or any *unchecked* exceptions.
5. **Static vs. Instance:** An instance method cannot override a static method (triggers compile error). A static method cannot override an instance method. 
   - If a subclass defines a static method with the same signature as a parent static method, the parent method is **hidden**, not overridden.

### Overriding vs. Overloading
- **Overriding:** Dynamic polymorphism. Done in subclasses. Same arguments, same name. Resolved at **runtime**.
- **Overloading:** Static polymorphism. Done in same class or subclass. Different arguments, same name. Resolved at **compile time** based on reference types.

### Field Shadowing (Variables are NOT Polymorphic)
In Java, polymorphism applies *only* to instance methods, not to instance variables (fields). 
- If a subclass declares a field with the same name as a parent class field, the subclass field **shadows** the parent class field.
- When you access a field, the JVM resolves it at **compile time** based on the **declared reference type**, not the actual runtime object type.

---

## 3. JVM Internals & Memory Layout

### Virtual Method Invocation (VMI) & the `vtable`
When the JVM compiles a class, it generates a virtual method table (**`vtable`**) for every class. 
- The `vtable` is an array of memory pointers pointing to the bytecode of virtual (overrideable) methods.
- If a subclass does not override a parent method, its `vtable` entry points to the parent's implementation.
- If the subclass overrides a parent method, the `vtable` entry is updated to point to the subclass's bytecode.
- At runtime, the JVM uses the `invokevirtual` bytecode instruction, which looks up the actual object's `vtable` to invoke the correct method.

```
+-----------------------------------------------------------+
| JVM POLYMORPHISM VS SHADOWING                             |
|                                                           |
| Declared Reference: Parent p = new Child();               |
|                                                           |
| 1. Field Access (Compile-Time Resolution):                |
|    - p.name ---> Resolved by Parent reference type        |
|    - Accesses Parent.name                                 |
|                                                           |
| 2. Method Access (Run-Time VMI Lookup):                   |
|    - p.show() -> Resolved by actual object type (Child)   |
|    - Looks up Child vtable ---> Invokes Child.show()      |
+-----------------------------------------------------------+
```

---

## 4. Tricky OCP Exam Questions

### Question 1: Access Modifier Restrictions in Overriding
Consider the following classes:
```java
class Super {
    protected void process() {}
}

class Sub extends Super {
    // INSERT CODE HERE
}
```
Which of the following method declarations can be inserted in `Sub` to compile successfully? (Select all that apply)
- A. `public void process() {}`
- B. `protected void process() {}`
- C. `void process() {}`
- D. `private void process() {}`

**Answer: A, B**
**Detailed Explanation:**
- According to Java method overriding rules, a subclass method **cannot assign a weaker (more restrictive) access privilege** than the parent class method.
- The parent method access modifier is `protected`.
- The hierarchy of access modifiers from most accessible to least accessible is:
  `public` $\rightarrow$ `protected` $\rightarrow$ default (package-private) $\rightarrow$ `private`.
- Therefore, the overriding method in the subclass must be either `protected` or `public`.
- **C (default access) is incorrect:** It restricts accessibility from `protected` to default (package-private).
- **D (`private`) is incorrect:** It restricts access even further.
- **A and B are correct:** They maintain or widen the access level.

---

### Question 2: Static Interface Methods and Inheritance
What is the result of attempting to compile and run the following code?
```java
interface Helper {
    static void log() {
        System.out.print("Log ");
    }
}

class Logger implements Helper {}

public class InterfaceStatic {
    public static void main(String[] args) {
        Logger logger = new Logger();
        // Option 1
        Helper.log();
        // Option 2
        // Logger.log();
        // Option 3
        // logger.log();
    }
}
```
If Option 2 and Option 3 are commented out, what is the behavior of the program?
- A. Compiles successfully and prints `Log `.
- B. Fails to compile because `Logger` must override the `log()` method.
- C. Fails to compile if Option 1 is executed because static methods of interfaces are not inherited.
- D. Throws a runtime exception.

**Answer: A**
**Detailed Explanation:**
- **Static interface methods are NOT inherited** by implementing classes or subinterfaces.
- This is a major difference compared to class static inheritance: a static class method *is* inherited by subclasses, but a static interface method is not.
- The only way to invoke a static interface method is by using the **interface name explicitly** (`Helper.log()`).
- Therefore:
  - `Helper.log();` (Option 1) compiles and runs successfully.
  - `Logger.log();` (Option 2) fails to compile because the class `Logger` does not inherit or contain a `log()` method.
  - `logger.log();` (Option 3) fails to compile because static interface methods cannot be invoked on instances of implementing classes.
- Since Option 2 and Option 3 are commented out in the question, the code compiles cleanly and prints `Log `.

---

### Question 3: Overlapping Default Interface Methods
What happens when you compile the following class definition?
```java
interface Walkable {
    default void move() { System.out.print("Walk "); }
}
interface Runnable {
    default void move() { System.out.print("Run "); }
}
class Athlete implements Walkable, Runnable {
    public void move() {
        Walkable.super.move();
        System.out.print("Athlete ");
    }
}
public class DiamondTest {
    public static void main(String[] args) {
        new Athlete().move();
    }
}
```
- A. Fails to compile due to conflicting default method implementations of `move()`.
- B. Compiles successfully and prints `Walk Athlete `.
- C. Compiles successfully and prints `Run Athlete `.
- D. Compiles successfully but results in an ambiguity warning.

**Answer: B**
**Detailed Explanation:**
- When a concrete class implements multiple interfaces that define default methods with the exact same signature (a Diamond Problem collision), the compiler throws an error unless the subclass explicitly overrides the method to resolve the conflict.
- Here, the class `Athlete` **does override** `move()`, which successfully resolves the compilation conflict.
- Inside the overridden method, Java allows developers to delegate to a specific interface implementation using the special syntax `<InterfaceName>.super.<methodName>()`.
- Here, `Walkable.super.move();` delegates execution to `Walkable`'s default implementation, printing `"Walk "`.
- Then, the body prints `"Athlete "`.
- Output: `Walk Athlete `.

---

### Question 4: Class Wins Rule (Parent Class vs. Interface Default Methods)
What is the output of running the following code?
```java
interface Speaker {
    default void speak() { System.out.print("Speak "); }
}

class Human {
    public void speak() { System.out.print("Hello "); }
}

class Child extends Human implements Speaker {}

public class ClassWins {
    public static void main(String[] args) {
        new Child().speak();
    }
}
```
- A. Fails to compile due to a signature conflict on `speak()`.
- B. Prints `Speak `
- C. Prints `Hello `
- D. Prints `Hello Speak `

**Answer: C**
**Detailed Explanation:**
- Java applies the **"Class Wins"** rule for method resolution conflicts between classes and interfaces.
- If a class inherits a method from a parent class, and also implements an interface with a default method of the exact same signature:
  - The parent class implementation **always takes precedence** over the default interface implementation.
  - The default interface method is ignored.
- In this code, `Child` inherits `speak()` from `Human`, and also implements `Speaker` (which contains default `speak()`).
- By the "Class Wins" rule, `Human.speak()` takes precedence.
- Output: `Hello `.

---

### Question 5: Polymorphic Arrays and ArrayStoreExceptions
What is the result of executing the following program?
```java
class Animal {}
class Dog extends Animal {}
class Cat extends Animal {}

public class ArrayPolymorph {
    public static void main(String[] args) {
        Animal[] array = new Dog[3];
        try {
            array[0] = new Dog();
            array[1] = new Cat();
        } catch (Exception e) {
            System.out.print("Exception ");
        }
    }
}
```
- A. Compiles and executes successfully without printing anything.
- B. Fails to compile.
- C. Throws a runtime `ArrayStoreException` (not caught by `catch(Exception)`).
- D. Prints `Exception ` (due to `ArrayStoreException` caught).

**Answer: D**
**Detailed Explanation:**
- **Compilation:** `Animal[] array = new Dog[3];` is syntactically valid because `Dog[]` can be assigned to `Animal[]` (covariance of arrays in Java). The compiler only checks if `Dog` and `Cat` are subclasses of `Animal` when assigning elements to the array, which they are. Thus, the code compiles successfully.
- **Runtime:** The actual array allocated on the Heap is of type `Dog[]`. At runtime, the JVM enforces type safety.
  - `array[0] = new Dog();` succeeds because the object matches the array type `Dog[]`.
  - `array[1] = new Cat();` attempts to store a `Cat` object inside a `Dog[]` array. The JVM detects this violation and throws a **`java.lang.ArrayStoreException`**.
- Since `ArrayStoreException` is a subclass of `RuntimeException` (which inherits from `Exception`), the `catch (Exception e)` block catches the exception and prints `"Exception "`.
- Output: `Exception `.

---

### Question 6: Method Hiding vs. Overriding exceptions
What is the compilation result of the following code?
```java
import java.io.IOException;

class Parent {
    public static void print() throws IOException {
        System.out.println("Parent");
    }
}

class Child extends Parent {
    public static void print() {
        System.out.println("Child");
    }
}
```
- A. Fails to compile because static methods cannot declare exceptions.
- B. Fails to compile because subclass `print()` does not declare `IOException`.
- C. Compiles successfully because static methods are hidden, not overridden, meaning standard overriding exception constraints do not apply.
- D. Fails to compile because `print()` must be an instance method.

**Answer: C**
**Detailed Explanation:**
- The methods in this code are `static`.
- In Java, static methods are **hidden, not overridden**.
- Crucially, the compiler's strict method overriding checks (such as access modifiers, return types, and checked exception limitations) do **not** apply to static method hiding.
- The subclass can hide a parent static method with a completely different exception signature (or declare no exceptions at all).
- Therefore, the class compiles successfully.

---

### Question 7: Interface Field Access and Ambiguity
Consider the following interfaces and class:
```java
interface Alpha {
    int SPEED = 50;
}
interface Beta {
    int SPEED = 100;
}
class Vehicle implements Alpha, Beta {
    public void printSpeed() {
        // Line 8
    }
}
```
Which statement compiles successfully if inserted at Line 8?
- A. `System.out.println(SPEED);`
- B. `System.out.println(Alpha.SPEED);`
- C. `System.out.println(super.SPEED);`
- D. `SPEED = 75;`

**Answer: B**
**Detailed Explanation:**
- Fields declared in interfaces are implicitly **`public static final`**.
- **A fails to compile:** Since both `Alpha` and `Beta` define a constant named `SPEED`, referencing `SPEED` directly inside `Vehicle` results in a compilation error: `reference to SPEED is ambiguous`.
- **B compiles:** The constant is accessed cleanly by prefixing the interface name (`Alpha.SPEED`).
- **C fails to compile:** `super` refers to the parent superclass (`java.lang.Object`), which does not contain `SPEED`. You cannot use `super` to access interface members in this way.
- **D fails to compile:** Interface variables are implicitly `final` and cannot be reassigned.

---

### Question 8: Compiler Cast Checks (Class vs. Interface Casting)
Given the class structure:
```java
interface Singer {}
class Athlete {}
class Runner extends Athlete {}

public class CastTest {
    public static void main(String[] args) {
        Athlete a = new Runner();
        
        // Line 8
        Singer s1 = (Singer) a; 
        
        // Line 11
        Runner r1 = (Runner) a; 
    }
}
```
Which of the following describes the compilation result of the casting statements?
- A. Both Line 8 and Line 11 compile successfully.
- B. Line 8 fails to compile, but Line 11 compiles successfully.
- C. Line 11 fails to compile, but Line 8 compiles successfully.
- D. Both casting lines fail to compile.

**Answer: A**
**Detailed Explanation:**
- **Line 11 (compiles):** `a` has a declared type of `Athlete`, and `Runner` is a subclass of `Athlete`. This is a downcast that is syntactically valid (verified at runtime).
- **Line 8 (compiles):** `a` has a declared type of `Athlete` (which is a class), and we are casting it to `Singer` (which is an interface).
- In Java, the compiler **allows casting any non-final class reference to any interface type**, even if the class does not implement the interface. The compiler assumes that a subclass of `Athlete` might implement `Singer` at runtime.
- Since `Athlete` is not a `final` class, this cast compiles without errors (though it will throw a `ClassCastException` at runtime because `Runner` does not actually implement `Singer`).
- *(Note: If `Athlete` were declared `final`, e.g. `final class Athlete {}`, the compiler would reject Line 8 because no subclass of `Athlete` could ever exist to implement `Singer`)*.

---

### Question 9: Overriding Private Methods
What is the compilation result of the following code?
```java
class Parent {
    private void show() {
        System.out.println("Parent");
    }
}

class Child extends Parent {
    @Override
    public void show() {
        System.out.println("Child");
    }
}
```
- A. Compiles successfully.
- B. Fails to compile because `Child.show()` cannot widen access of a private method.
- C. Fails to compile because `@Override` is invalid (private methods cannot be overridden).
- D. Fails to compile because private methods must be abstract in parent.

**Answer: C**
**Detailed Explanation:**
- Subclasses do not inherit `private` methods of parent classes.
- Since `Parent.show()` is private, it is completely invisible to `Child`.
- Therefore, `Child` cannot override it. The method `show()` in `Child` is treated as a completely new method declaration.
- Because `show()` in `Child` is not overriding any accessible method from the parent class, using the `@Override` annotation results in a compile-time error: `method does not override or implement a method from a supertype`.
- If `@Override` were removed, the code would compile successfully.

---

### Question 10: Private Methods in Interfaces (Java 9+)
Which of the following statements about `private` methods in Java interfaces is correct? (Select all that apply)
- A. They cannot be static.
- B. A private static interface method can be called from both default and static methods in the same interface.
- C. A private non-static interface method can be called from default methods, but not from static methods in the same interface.
- D. Private interface methods must contain a body implementation.
- E. They are inherited by classes implementing the interface.

**Answer: B, C, D**
**Detailed Explanation:**
- **A is incorrect:** Private static interface methods are permitted.
- **B is correct:** Static members can be called from both static and non-static contexts.
- **C is correct:** Non-static private methods cannot be called from a static interface method because static methods have no instance context.
- **D is correct:** All private methods (like static and default methods) must provide a body block `{ ... }`. They cannot be abstract.
- **E is incorrect:** Private members are private to the interface and are never inherited or visible to implementing classes.

---

### Question 11: Interface inheritance with default method overrides
Consider the interfaces:
```java
interface Base {
    default void print() { System.out.print("Base "); }
}
interface Intermediate extends Base {
    void print(); // redeclared abstract
}
class Concrete implements Intermediate {
    public void print() {
        System.out.print("Concrete");
    }
}
```
If you execute `new Concrete().print();`, what is the output?
- A. `Base Concrete`
- B. `Concrete`
- C. Fails to compile because `Intermediate` cannot declare default methods as abstract.
- D. Fails to compile because `Concrete` is missing default implementation.

**Answer: B**
**Detailed Explanation:**
- An interface (`Intermediate`) can extend another interface (`Base`) and redeclare a default method as **abstract**.
- This effectively "strips" the default implementation, forcing any concrete classes implementing `Intermediate` to provide an explicit implementation of `print()`.
- The class `Concrete` implements `Intermediate` and overrides `print()`, printing `"Concrete"`.
- Output: `Concrete`.

---

### Question 12: Final Methods and Method Hiding
What is the result of compiling the following class hierarchy?
```java
class Parent {
    public final static void log() {}
}
class Child extends Parent {
    public static void log() {}
}
```
- A. Compiles successfully because static methods are hidden, not overridden.
- B. Fails to compile because `final` methods cannot be overridden or hidden.
- C. Fails to compile because static methods cannot be declared final.
- D. Compiles but warns about method overriding conflicts.

**Answer: B**
**Detailed Explanation:**
- Even though static methods are hidden rather than overridden, the **`final` keyword still prevents subclass hiding**.
- If a superclass declares a static method as `final` (`public final static void log()`), subclasses are prohibited from defining a static method with the same signature.
- Attempting to do so results in a compilation error: `log() in Child cannot override/hide log() in Parent; overridden/hidden method is final`.

---

### Question 13: Concrete subclass implementing abstract class
What is the compile result of the following code?
```java
interface Action {
    void run();
}
abstract class Worker implements Action {}

class ConcreteWorker extends Worker {
    // empty
}
```
- A. Compiles successfully.
- B. Fails to compile because `Worker` must implement the `run()` method of `Action`.
- C. Fails to compile because `ConcreteWorker` must implement the `run()` method of `Action`.
- D. Fails to compile because `Worker` cannot implement an interface without overriding all methods.

**Answer: C**
**Detailed Explanation:**
- **Abstract classes** (`Worker`) do not have to implement the abstract methods of interfaces they implement. They can delegate the implementation to their subclasses.
- However, the **first concrete subclass** (`ConcreteWorker`) that extends `Worker` must implement all inherited abstract methods.
- Since `ConcreteWorker` is concrete and does not implement `run()`, compilation fails with the error: `ConcreteWorker is not abstract and does not override abstract method run() in Action`.

---

### Question 14: Overloading with incompatible return types
Given the class:
```java
public class OverloadTest {
    public void print(int x) {}
    public int print(int x) { return x; }
}
```
Does this compile?
- A. Yes, because overloading allows different return types.
- B. No, because return type alone is not sufficient to distinguish overloaded methods.
- C. Yes, if the access modifier of the second method is changed to private.
- D. No, because the parameter lists are identical.

**Answer: D**
**Detailed Explanation:**
- To overload a method, the parameter lists **must be different** (different number of arguments, different types, or different order of types).
- Changing the return type or the access modifier is **not sufficient** to overload a method.
- Since both methods have the signature `print(int)`, they are considered duplicates by the compiler, and compilation fails.

---

### Question 15: Abstract Methods Overriding Concrete Methods
Is it valid for an abstract method in an abstract class to override a concrete method in a superclass?
```java
class NormalClass {
    public void execute() { System.out.println("Normal"); }
}
abstract class AbstractSub extends NormalClass {
    public abstract void execute();
}
```
- A. No, an abstract method cannot override a concrete method.
- B. Yes, this is valid and forces concrete subclasses of `AbstractSub` to override the method.
- C. Fails to compile because `AbstractSub` must call `super.execute()`.
- D. Yes, but it results in a runtime warning.

**Answer: B**
**Detailed Explanation:**
- In Java, it is perfectly valid for an abstract class (`AbstractSub`) to override a concrete method (`execute()`) and declare it as `abstract`.
- This design choice forces any concrete subclasses of `AbstractSub` to provide a new implementation of `execute()`, ignoring the default concrete behavior defined in `NormalClass`.
- The code compiles cleanly.

---

### Question 16: Variable Access via Type casting
What is the output of executing the following program?
```java
class Parent {
    int val = 10;
}
class Child extends Parent {
    int val = 20;
}
public class CastField {
    public static void main(String[] args) {
        Child c = new Child();
        System.out.println(c.val + " " + ((Parent) c).val);
    }
}
```
- A. `20 20`
- B. `10 20`
- C. `20 10`
- D. Fails to compile.

**Answer: C**
**Detailed Explanation:**
- Reference casting (e.g. `(Parent) c`) changes the **compile-time reference type** of the variable.
- Since fields are resolved based on the declared type of the reference at compile-time, `c.val` accesses the variable in `Child` (value `20`), whereas `((Parent) c).val` accesses the variable in `Parent` (value `10`).
- Therefore, the output is `20 10`.

---

### Question 17: Abstract Interface Methods modifiers
Which of the following modifiers are implicitly applied to all abstract interface methods in Java? (Select all that apply)
- A. `public`
- B. `abstract`
- C. `static`
- D. `final`
- E. `protected`

**Answer: A, B**
**Detailed Explanation:**
- All abstract methods declared in an interface are implicitly **`public`** and **`abstract`**.
- Declaring them as `public abstract void method();` is permitted but considered redundant.
- Interface methods cannot be `protected` or package-private (default).
- They cannot be `final` because abstract methods must be implemented by subclasses, and `final` prevents implementation. They cannot be `static` unless they have a method body.

---

### Question 18: Interface extension rules
Which of the following statements about interfaces extending other interfaces is correct?
- A. An interface implements other interfaces using the `implements` keyword.
- B. An interface can extend multiple interfaces using the `extends` keyword.
- C. An interface can only extend a single interface.
- D. Interfaces cannot extend other interfaces.

**Answer: B**
**Detailed Explanation:**
- Interfaces do not implement other interfaces (they cannot contain concrete implementations of abstract methods).
- Instead, interfaces **extend** other interfaces using the **`extends`** keyword.
- Unlike classes (which only support single inheritance of state), an interface **can extend multiple interfaces** (e.g. `interface C extends A, B {}` is perfectly valid).
- Therefore, B is correct.

---

### Question 19: Covariant Return Type primitive compatibility
Can covariant return types be applied to primitive return types in method overriding?
```java
class Parent {
    public long getNumber() { return 1L; }
}
class Child extends Parent {
    public int getNumber() { return 1; }
}
```
- A. Yes, because `int` is compatible with `long`.
- B. No, covariant return types are strictly restricted to object references.
- C. Yes, but only if both values are cast explicitly.
- D. Yes, because `int` can be promoted to `long`.

**Answer: B**
**Detailed Explanation:**
- Covariant return types **only apply to reference types** (objects).
- For primitive return types, the overriding method **must have the exact same return type** as the overridden method.
- Even though `int` is a subtype of `long` in numeric ranges, primitive type systems in Java do not support covariant overrides.
- Therefore, `Child` fails to compile because its return type `int` is incompatible with `long` in an override.

---

### Question 20: Overriding with exceptions inheritance structure
Given the classes:
```java
import java.io.*;

class Parent {
    public void print() throws IOException {}
}
class Child extends Parent {
    public void print() throws FileNotFoundException {}
}
```
Why does this code compile successfully?
- A. Because `FileNotFoundException` is a subclass of `IOException`.
- B. Because `Child.print()` throws a broader exception.
- C. Because exception declarations are ignored during compilation.
- D. Because `FileNotFoundException` is an unchecked exception.

**Answer: A**
**Detailed Explanation:**
- Overriding methods can declare **narrower checked exceptions** than the parent method.
- `FileNotFoundException` is a subclass of `IOException`.
- Since it is narrower, the overriding method in `Child` conforms to exception overriding constraints, and the code compiles successfully.

