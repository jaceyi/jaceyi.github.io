---
layout: post
title: 详解 React useCallback & useMemo
description: 本文详细的讲述了 useCallback 与 useMemo 的使用场景，以及有哪些使用中常遇到的问题与采坑点。
tags: JavaScript React
bannerImg: /static/images/bg4.jpg
---

## 前言

阅读本文章需要对 [React Hooks](https://reactjs.org/docs/hooks-intro.html) 中 [useState](https://reactjs.org/docs/hooks-state.html) 和 [useEffect](https://reactjs.org/docs/hooks-effect.html) 有基础的了解。我的这篇文章内有大致介绍 [在 React 项目中全量使用 Hooks](/2020/03/16/React-use-Hooks.html)。

<!--more-->

## useCallback

### useCallback 的作用

官方文档：

> Pass an inline callback and an array of dependencies. useCallback will return a memoized version of the callback that only changes if one of the dependencies has changed.

简单来说就是返回一个函数，只有在依赖项发生变化的时候才会更新（返回一个新的函数）。

### useCallback 的应用

在线代码： [Code Sandbox](https://codesandbox.io/s/usecallback1-yu1sp)

```javascript
import React, { useState, useCallback } from "react";
import Button from "./Button";

export default function App() {
  const [count1, setCount1] = useState(0);
  const [count2, setCount2] = useState(0);
  const [count3, setCount3] = useState(0);

  const handleClickButton1 = () => {
    setCount1(count1 + 1);
  };

  const handleClickButton2 = useCallback(() => {
    setCount2(count2 + 1);
  }, [count2]);

  return (
    <div>
      <div>
        <Button onClickButton={handleClickButton1}>Button1</Button>
      </div>
      <div>
        <Button onClickButton={handleClickButton2}>Button2</Button>
      </div>
      <div>
        <Button
          onClickButton={() => {
            setCount3(count3 + 1);
          }}
        >
          Button3
        </Button>
      </div>
    </div>
  );
}
```

```javascript
// Button.jsx
import React from "react";

const Button = ({ onClickButton, children }) => {
  return (
    <>
      <button onClick={onClickButton}>{children}</button>
      <span>{Math.random()}</span>
    </>
  );
};

export default React.memo(Button);
```

在案例中可以分别点击 Demo 中的几个按钮来查看效果：

- 点击 Button1 的时候只会更新 Button1 和 Button3 后面的内容;
- 点击 Button2 会将三个按钮后的内容都更新;
- 点击 Button3 的也是只更新 Button1 和 Button3 后面的内容。

上述效果仔细理一理就可以发现，只有经过 `useCallback` 优化后的 Button2 是点击自身时才会变更，其他的两个只要父组件更新后都会变更（这里 Button1 和 Button3 其实是一样的，无非就是函数换了个地方写）。下面我们仔细看看具体的优化逻辑。

> 这里或许会注意到 Button 组件的 **[`React.memo`](https://reactjs.org/docs/react-api.html#reactmemo)** 这个方法，此方法内会对 props 做一个浅层比较，如果如果 props 没有发生改变，则不会重新渲染此组件。

```
const a = () => {};
const b = () => {};
a === b; // false
```

上述代码可以看到我们两个一样的函数却是不相等的（这是个废话，我相信能看到这的人都知道，所以不做解释了）。

```javascript
const [count1, setCount1] = useState(0);
// ...
const handleClickButton1 = () => {
  setCount1(count1 + 1);
};
// ...
return <Button onClickButton={handleClickButton1}>Button1</Button>;
```

回头再看上面的 `Button` 组件都需要一个 `onClickButton` 的 props ，尽管组件内部有用 `React.memo` 来做优化，但是我们声明的 `handleClickButton1` 是直接定义了一个方法，这也就导致只要是父组件重新渲染（状态或者 props 更新）就会导致这里声明出一个新的方法，新的方法和旧的方法尽管长的一样，但是依旧是两个不同的对象，`React.memo` 对比后发现对象 props 改变，就重新渲染了。

```js
const handleClickButton2 = useCallback(() => {
  setCount2(count2 + 1);
}, [count2]);
```

上述代码我们的方法使用 useCallback 包装了一层，并且后面还传入了一个 `[count2]` 变量，这里 useCallback 就会根据 `count2` 是否发生变化，从而决定是否返回一个新的函数，函数**内部作用域**也随之更新。

由于我们的这个方法只依赖了 `count2` 这个变量，而且 `count2` **只在**点击 Button2 后才会更新 `handleClickButton2`，所以就导致了我们点击 Button1 不重新渲染 Button2 的内容。

### Tips

```javascript
import React, { useState, useCallback } from "react";
import Button from "./Button";

export default function App() {
  const [count2, setCount2] = useState(0);

  const handleClickButton2 = useCallback(() => {
    setCount2(count2 + 1);
  }, []);

  return (
    <Button count={count2} onClickButton={handleClickButton2}>
      Button2
    </Button>
  );
}
```

我们调整了一下代码，将 useCallback 依赖的第二个参数变成了一个**空的数组**，这也就意味着这个方法没有依赖值，将不会被更新。且由于 JS 的静态作用域导致此函数内 `count2` 永远都 `0`。

可以点击多次 Button2 查看变化，会发现 Button2 后面的值只会改变一次。因为上述函数内的 `count2` 永远都是 `0`，就意味着每次都是 `0 + 1`，Button 所接受的 `count` props，也只会从 `0` 变成 `1`且一直都将是 `1`，而且 `handleClickButton2` 也因没有依赖项不会返回新的方法，就导致 Button 组件只会因 `count` 改变而更新一次。

---

上述提到的是不更新所带来的问题，接下来在看一个频繁更新所带来的问题。

```javascript
const [text, setText] = useState("");

const handleSubmit = useCallback(() => {
  // ...
}, [text]);

return (
  <form>
    <input value={text} onChange={(e) => setText(e.target.value)} />
    <OtherForm onSubmit={handleSubmit} />
  </form>
);
```

上述例子中可以看到我们的 `handleSubmit` 会依赖 `text` 的更新而去更新，在 `input` 的使用中 `text` 的变化肯定是相当频繁的，假如这时候我们的 `OtherForm` 是一个很大的组件，必须要进行优化这个时候可以使用 `useRef` 来帮忙。

```javascript
const textRef = useRef("");
const [text, setText] = useState("");

const handleSubmit = useCallback(() => {
  console.log(textRef.current);
  // ...
}, [textRef]);

return (
  <form>
    <input
      value={text}
      onChange={(e) => {
        const { value } = e.target;
        setText(value);
        textRef.current = value;
      }}
    />
    <OtherForm onSubmit={handleSubmit} />
  </form>
);
```

使用 `useRef` 可以生成一个变量让其在组件每个生命周期内都能访问到，且 `handleSubmit` 并不会因为 `text` 的更新而更新，也就不会让 `OtherForm` 多次渲染。

---

评论中有为朋友提到是否要把所有的方法都用 useCallback 包一层呢，这个应该也是很多刚了解 useCallback 的朋友的一疑问。先说答案是：**不要把所有的方法都包上 useCallback**，下面仔细讲。

```javascript
const [count1, setCount1] = useState(0);
const [count2, setCount2] = useState(0);

const handleClickButton1 = () => {
  setCount1(count1 + 1);
};
const handleClickButton2 = useCallback(() => {
  setCount2(count2 + 1);
}, [count2]);

return (
  <>
    <button onClick={handleClickButton1}>button1</button>
    <button onClick={handleClickButton2}>button2</button>
  </>
);
```

上面这种写法在当前组件重新渲染时会声明一个新的 `handleClickButton1` 函数，下面 `useCallback` 里面的函数也会声明一个新的函数，被传入到 `useCallback` 中，尽管这个函数有可能因为 `inputs` 没有发生改变不会被返回到 `handleClickButton2` 变量上。

那么在我们这种情况它返回新的函数和老的函数也都一样，因为下面 `<button>` 已经都会被渲染一下，反而使用 `useCallback` 后每次执行到这里内部要要比对 `inputs` 是否变化，还有存一下之前的函数，消耗更大了。

> useCallback 是要配合子组件的 **`shouldComponentUpdate`** 或者 **`React.memo`** 一起来使用的，否则就是反向优化。

## useMemo

### useMemo 的作用

官方文档：

> Pass a “create” function and an array of dependencies. useMemo will only recompute the memoized value when one of the dependencies has changed.

简单来说就是传递一个创建函数和依赖项，创建函数会需要返回一个值，只有在依赖项发生改变的时候，才会重新调用此函数，返回一个新的值。

### useMemo 的应用

useMemo 与 useCallback 很像，根据上述 useCallback 已经可以想到 useMemo 也能针对传入子组件的值进行缓存优化。

```javascript
// ...
const [count, setCount] = useState(0);

const userInfo = {
  // ...
  age: count,
  name: 'Jace'
}

return <UserCard userInfo={userInfo}>
```

```javascript
// ...
const [count, setCount] = useState(0);

const userInfo = useMemo(() => {
  return {
    // ...
    name: "Jace",
    age: count
  };
}, [count]);

return <UserCard userInfo={userInfo}>
```

很明显的上面的 userInfo 每次都将是一个新的对象，无论 `count` 发生改变没，都会导致 UserCard 重新渲染，而下面的则会在 `count` 改变后才会返回新的对象。

上述用法是有有关于父子组件传值带来的性能优化，实际上 useMemo 的作用**不止于此**，根据官方文档内介绍：

> This optimization helps to avoid expensive calculations on every render.

可以把一些昂贵的计算逻辑放到 useMemo 中，只有当依赖值发生改变的时候才去更新。

```javascript
const num = useMemo(() => {
  let num = 0;
  // 这里使用 count 针对 num 做一些很复杂的计算，当 count 没改变的时候，组件重新渲染就会直接返回之前缓存的值。
  return num;
}, [count]);

return <div>{num}</div>;
```

事实上在使用中 useMemo 的场景远比 useCallback 要广泛的很多，我们可以将 useMemo 的返回值定义为返回一个函数这样就可以变通的实现了 useCallback。在开发中当我们有部分变量改变时会影响到多个地方的更新那我们就可以返回一个对象或者数组，通过解构赋值的方式来实现同时对多个数据的缓存。

```javascript
const [age, followUser] = useMemo(() => {
  return [
    new Date().getFullYear() - userInfo.birth, // 根据生日计算年龄
    async () => {
      // 关注用户
      await request("/follow", { uid: userInfo.id });
      // ...
    },
  ];
}, [userInfo]);

return (
  <div>
    <span>name: {userInfo.name}</span>
    <span>age: {age}</span>
    <Card followUser={followUser} />
    {useMemo(
      () => (
        // 如果 Card1 组件内部没有使用 React.memo 函数，那还可以通过这种方式在父组件减少子组件的渲染
        <Card1 followUser={followUser} />
      ),
      [followUser]
    )}
  </div>
);
```

## 结语

简单理解呢 useCallback 与 useMemo 一个缓存的是函数，一个缓存的是函数的返回值。useCallback 是来优化子组件的，防止子组件的重复渲染。useMemo 可以优化当前组件也可以优化子组件，优化当前组件主要是通过 memoize 来将一些复杂的计算逻辑进行缓存。当然如果只是进行一些简单的计算也没必要使用 useMemo，这里可以考虑一些计算的性能消耗和比较 inputs 的性能消耗来做一个权衡（如果真有逻辑跟这个比较逻辑差不多，也没必要使用 useMemo ，还能减少一点对键盘磨损 😅）。

结束。
