---
layout: post
title: JS函数式编程&高阶函数的应用
description: 本篇讲述何为函数式编程以及高阶函数的应用，熟练地使用高阶函数能大幅的提高开发效率、减少代码量、优雅封装。
tags: JavaScript
bannerImg: /static/images/bg4.jpg
---

## 前言

### 函数是 JavaScript 的一等公民

<!--more-->

简单提一下，一等公民都具备以下特性：

- 可以被存入变量或者其他数据结构
- 可以作为函数的参数
- 可以作为函数的返回值
- 可以判断相等性

写过 JS 的人肯定都知道函数是能满足上述的特性。

> 函数式编程是一种编程范式，其中函数定义的是表达式树，每个表达式都返回一个值，而不是改变程序状态的命令语句。因为函数是 JavaScript 的一等公民，所以可以把函数作为其他函数的参数或者返回值，这样就可以将其中小功能以模块化的方式组合在一起。

## 纯函数

可以通过禁止更改外部状态和数据来定义纯函数，纯函数是只依赖实际参数，不管任何全局或者局部的状态。**既输入相同的参数，输出的内容永远都是一样的。**

```javascript
const sum = (x, y) => x + y;
sum(1, 2); // 3
```

**原生例子**

```javascript
let arr = [1, 2, 3];
arr.slice(0, 1); // [1]
arr.slice(0, 1); // [1]
arr; // [1, 2, 3]

arr.splice(0, 1); // [1]
arr.splice(0, 1); // [2]
arr; // [3]
```

由上可见数组的 `slice` 方法是纯函数，不会改变原对象；`splice` 改变了原对象，导致每次操作自身都发生变化，所以不是纯函数。

### 纯函数的好处 - memoize

> 使用纯函数时我们发现程序出现了与预期不符的情况，也就是输出的值不是想要得值，那么只用检查输入的参数就 OK。

上面提到纯函数，输入值不变，那么输出值也会不变，这里就可以对比输入的参数是否发生变化，来决定是否要重新渲染来实现一个缓存优化。

```javascript
const memoize = (f) => {
  // 缓存函数
  let cache = {};
  return (a) => {
    // 这里为了方便 就只接收一个参数了
    const prevValue = cache[a];
    if (prevValue) {
      console.log(`cache ${prevValue}`);
      return prevValue;
    }
    return (cache[a] = f(a)); // 缓存纯函数的值
  };
};
const double = (x) => x * 2; // 运算函数（纯函数）
const f = memoize(double);

f(2); // 4
f(2); // cache 4

f(8); // 16
f(8); // cache 16
```

## 柯里化 Curry

柯里化是把接收多个参数的函数变成接收单一参数的函数，剩下的参数再通过返回的函数来进行接收。
简单理解就是把函数拆的更细，返回的函数依赖第一个参数进行计算，可以缩小适用范围，创建一个针对性更强的函数。

- 可以将上述求和纯函数改成下面的写法

```javascript
const sum = (x) => (y) => x + y;
sum(1)(2); // 3
```

将 `sum` 函数转为只接收一个参数，并返回一个函数，再次调用将得到结果。
或许有人觉得这样写纯属蛋疼，那么就举一个业务中会用到的一个例子。我们需要一个可以将金额转为千分位的函数，但是金额的单位不定，有可能是分，有可能是角等。

```javascript
const formatMoney = (money, step) => {
  let str = (money / step).toFixed(2); // 两位小数
  const index = str.indexOf(".");
  if (index > 3) {
    const start = str.substring(0, index).replace(/\B(?=(?:\d{3})+$)/g, ","); // 增加千分位符号
    return start + str.substring(index);
  }
  return str;
};
formatMoney(1000000, 100); // 分 10,000.00
formatMoney(123456, 100); // 分 1,234.56
formatMoney(123456, 10); // 角 12,345.60
```

传入两个参数 `(money, step)` 金额和单位，在函数中依据单位来实时金额。但是每次都要传单位，造成重复的代码。

**我们可以将上述方法转为柯里化函数：**

```javascript
const formatMoney = (step) => (money) => {
  let str = (money / step).toFixed(2); // 两位小数
  const index = str.indexOf(".");
  if (index > 3) {
    const start = str.substring(0, index).replace(/\B(?=(?:\d{3})+$)/g, ","); // 增加千分位符号
    return start + str.substring(index);
  }
  return str;
};
const pennyMoney = formatMoney(100); // 单位是分
pennyMoney(1000000); // 10,000.00
pennyMoney(123456); // 1,234.56

const dimeMoney = formatMoney(10); // 单位是角
dimeMoney(1000000); // 100,000.00
dimeMoney(123456); // 12,345.60

formatMoney(1)(1000000); // 1,000,000; // 元
```

我们通过柯里化的方式预先传入单位，返回一个针对该单位的格式化方法，这样我们就能在不同的情况下加以复用，其中 `pennyMoney` 与 `dimeMoney` 也能加以复用，不用在每次都传入要通过什么单位来格式化。

## 高阶函数

> 高阶函数可以把其他函数作为参数输入或者作为其返回值输出。

原生的方法有很多都是高阶函数，例如 `Array.prototype.map` 方法，他接收一回调函数，从回调函数中获取返回值，再使用这些值创建一个新的数组并返回。

### 高阶函数的应用

上述我们通过柯里化的方式优化了格式金额的方法，可以看到柯里化的方式也会返回一个函数，那么我们可以认为，他也是高阶函数。下面我们将再自定义一些高阶函数，让我们更加理解高阶函数的应用。

#### 🌰 防抖函数

我有一个方法会根据窗口大小进行动态加载对应的组件，既然需要动态加载组件那么资源的请求以及组件的渲染肯定是对网络、内存等消耗要大一些的，那么我们就可以进行一个**防抖**操作，让窗口大小发生变化时没必要要那么实时变化。

```javascript
const debounce = (func, wait) => {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
    }, wait);
  };
};

window.addEventListener(
  "resize",
  debounce(() => {
    if (window.matchMedia("(min-width:768px)")) {
      // loader component
    }
    console.log("resize");
  }, 500)
);
```

上述代码实现了一个 `debounce` 函数，将接收一个函数和一个等待时间作为参数，返回一个新的函数，函数执行时会做一个延时防抖的操作。这样在窗口频繁的 `resize` 时短时间内也不会多次触发加载组件的方法。当然该防抖函数还能应用于其他很多场景。

#### 🌰 组合 compose

```javascript
const compose =
  (...funcs) =>
  (arg) => {
    return funcs.reduce((val, f) => f(val), arg);
  };
```

这是一个很经典的高阶函数，他接收多个函数作为参数，返回一个函数，返回的这个函数呢会接收一个参数。那他的作用是什么呢？可以执行以下代码看看。

```javascript
const compose =
  (...funcs) =>
  (arg) => {
    return funcs.reduce((val, f) => {
      const result = f(val);
      console.log(result);
      return result;
    }, arg);
  };

const pennyTransform = (money) => money / 100;
const fixedMoney = (money) => (+money).toFixed(2);
const thousandthMoney = (str) => {
  const index = str.indexOf(".");
  if (index > 3) {
    const start = str.substring(0, index).replace(/\B(?=(?:\d{3})+$)/g, ",");
    return start + str.substring(index);
  }
  return str;
};

const formatMoney = compose(pennyTransform, fixedMoney, thousandthMoney);
formatMoney(1000000);

// 10000
// 10000.00
// 10,000.00
```

上述代码依旧是格式化金额，只不过换了种写法。我们可以从输出的 log 中看出，我们的方法 `compose` 是把所有的方法进行一个组合，依次调用，将上一个函数的返回值传入给下一个参数（第一个参数为调用时传的参数）。这样我们就可以将函数功能拆分的很细，一个只做一件事，每个都是纯函数，每一个很小的功能就是一个粒子，我们可以随意将其组合拆分，使其应用场景更广泛。

很多同学或许搞不懂 `compose` 这个函数具体的逻辑，接下来就仔细讲一讲。可以在代码中看到最重要的 `reduce` 这个函数，这是数组原生的一个方法，可以先看看 MDN 上对这个方法的描述 [
Array.prototype.reduce](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce)：方法会对数组中的每一个元素执行传入的函数，再将其汇总结果返回。

**接收两个参数：**

`callback` 执行数组中每个值，此函数会接收四个参数，这里我们只看用到的前两个参数：

- `accumulator` 累计器累计回调的返回值，简单理解就是上一个调用回调函数的返回值。如果是第一个次调用那么就是下面的 `initialValue` 或者 `undefined`。

- `currentValue` 数组中当前正在处理的元素。我们数组内的元素都是方法，也就是这里将是当前需要执行的方法。

`initialValue` 第一次调用回调函数传的值。

```javascript
const compose =
  (...funcs) =>
  (initialValue) => {
    return funcs.reduce((accumulator, currentValue) => {
      // 第一次执行 accumulator 为传入的 initialValue

      // 将 accumulator 传入 currentValue（当前需要执行的方法），
      // 这里也会将函数调用的结果进行立即返回，返回的值将会在执行到下一个函数时当 accumulator 使用
      // 一直到执行完最后一个函数，将最后一个函数的返回值进行返回。
      return currentValue(accumulator);
    }, initialValue);
  };
```

这里大致讲了讲函数的执行流程，方便理解，有问题欢迎评论区留言，有错误欢迎指正。

**参考**

- [函数式编程指北](https://llh911001.gitbooks.io/mostly-adequate-guide-chinese/content/)
- [First-class citizen](https://en.wikipedia.org/wiki/First-class_citizen)
- [First-class function](https://en.wikipedia.org/wiki/First-class_function)

## 最后

原本打算顺带把高阶组件写一写，想一想还是放到下一个文章里面吧，打算写一写 React 的高阶组件与自定义 Hook。

2020.8.25 更新 [在 React 中自定义 Hooks 的应用场景](/2020/08/25/React-Custom-Hooks.html)
