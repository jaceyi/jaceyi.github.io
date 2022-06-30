---
layout: post
title: 在 React 项目中全量使用 Hooks
description: React 全部 Hooks 总结，以及 React Redux、React Router 中常用 Hooks 整理。
tags: JavaScript React
bannerImg: /static/images/bg-banner.jpeg
---

此文章只是整理了在 React 项目开发中常用的一些 Hooks，具体的用法及使用场景后续会持续跟新，并会加上链接。

## React Hooks

> Hooks 只能用于函数组件当中。

<!--more-->

### useState

```javascript
import { useState } from "react";

const Component = () => {
  const [count, setCount] = useState(0);

  return <button onClick={() => setCount(count + 1)}>click</button>;
};
```

此方法会返回两个值：当期状态和更新状态的函数。效果同 `this.state` 与 `this.setState`，区别是 `useState` 传入的值并不一定要对象，并且在更新的时候不会把当前的 state 与旧的 state 合并。

### useReducer

`useReducer` 接收两个参数，第一个是 reducer 函数，通过该函数可以更新 state，第二个参数为 state 的初始值，是 `useReducer` 返回的数组的第一个值，也是在 reducer 函数第一次被调用时传入的一个参数。

**基础用法**

```javascript
import { useReducer } from "react";

const Component = () => {
  const [count, dispatch] = useReducer((count, action) => {
    switch (action) {
      case "subtract":
        return count - 1;
      case "add":
        return count + 1;
    }
  }, 0);

  return (
    <div>
      <span>{count}</span>
      <button onClick={() => dispatch("subtract")}>subtract</button>
      <button onClick={() => dispatch("add")}>add</button>
    </div>
  );
};
```

在基础用法中，返回一个 dispatch 通过 dispatch 触发不同的 action 来加减 state。这里既然能传 `string` action 那么肯定也能传递更复杂的参数来面对更复杂的场景。

**进阶用法**

```javascript
import { useReducer } from "react";

const Component = () => {
  const [userInfo, dispatch] = useReducer(
    (state, { type, payload }) => {
      switch (type) {
        case "setName":
          return {
            ...state,
            name: payload,
          };
        case "setAge":
          return {
            ...state,
            age: payload,
          };
      }
    },
    {
      name: "Jace",
      age: 18,
    }
  );

  return (
    <button onClick={() => dispatch({ type: "setName", payload: "John" })}>
      click
    </button>
  );
};
```

### useContext

在上述案例 `useReducer` 中，我们将函数的参数改为一个对象，分别有 `type` 和 `payload` 两个参数，`type` 用来决定更新什么数据，`payload` 则是更新的数据。写过 react-redux 的同学可能发这个 reducer 与 react-redux 中的 reducer 很像，我们借助 react-redux 的思想可以实现一个对象部分更改的 reducer ，那么我们便可以使用 React Hooks 的 `useContext` 来实现一个状态管理。

```javascript
import { useMemo, createContext, useContext, useReducer } from "react";

const store = createContext([]);

const App = () => {
  const reducerValue = useReducer(
    (state, { type, payload }) => {
      switch (type) {
        case "setName":
          return {
            ...state,
            name: payload,
          };
        case "setAge":
          return {
            ...state,
            age: payload,
          };
      }
    },
    {
      name: "Jace",
      age: 18,
    }
  );
  const [state, dispatch] = reducerValue;

  const storeValue = useMemo(() => reducerValue, reducerValue);

  return (
    <store.Provider value={storeValue}>
      <Child />
    </store.Provider>
  );
};

const Child = () => {
  const [state, dispatch] = useContext(store); // 在子组件中使用
  console.log(state);
  return (
    <button onClick={() => dispatch({ type: "setName", payload: "John" })}>
      click
    </button>
  );
};
```

### useEffect

```javascript
import { useState, useEffect } from "react";

let timer = null;

const Component = () => {
  const [count, setCount] = useState(0);

  // 类似于 class 组件的 componentDidMount 和 componentDidUpdate:
  useEffect(() => {
    document.title = `You clicked ${count} times`;

    timer = setInterval(() => {
      // events ...
    }, 1000);

    return () => {
      // 类似 componentWillUnmount
      // unmount events ...
      clearInterval(timer); // 组件卸载 移除计时器
    };
  }, [count]);

  // ...
};
```

如果 `useEffect` 第二个参数数组内的值发生了变化，那么 `useEffect` 第一个参数的回调将会被再执行一遍。

### useLayoutEffect

`useLayoutEffect` 与 `useEffect` 的 API 相同，区别：`useEffect` 在浏览器渲染后执行，`useLayoutEffect` 在浏览器渲染之前执行，由于 JS 是单线程，所以 `useLayoutEffect` 还会阻塞浏览器的渲染。区别就是这，那么应用场景肯定是从区别中得到的，`useLayoutEffect` 在渲染前执行，也就是说我们如果有状态变了需要依据该状态来操作 DOM，为了避免状态变化导致组件渲染，然后更新 `DOM` 后又渲染，给用户肉眼能看到的闪烁，我们可以在这种情况下使用 `useLayoutEffect`。

> 当然这个不只是状态的改变，在任何导致组件重新渲染，而且又要改变 `DOM` 的情况下都是 `useLayoutEffect` 的使用场景。当然这种场景不多，`useLayoutEffect` 也不能多用，且使用时同步操作时长不能过长，不然会给用户带来明显的卡顿。

### useRef

细心的同学有可能发现我在上面写 `useEffect` 中有一个 `timer` 变量，我将其定义在了函数组件外面，这样写简单使用是没问题的，但是如果该组件在同一页面有多个实例，那么组件外部的这个变量将会成共用的，会带来一个冲突，所以我们需要一个能在函数组件声明周期内部的变量，可以使用 `useState` 中的 state 但是 state 发生变化组件也会随之刷新，在有些情况是不需要刷新的，只是想单纯的存一个值，例如计时器的 `timer` 以及子组件的 Ref 实例等等。

```javascript
import React, { useRef, useState, useEffect } from "react";

const Compnent = () => {
  const timer = useRef(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    clearInterval(timer.current);
    timer.current = setTimeout(() => {
      setCount(count + 1);
    }, 1000);
  }, [count]);

  return <div>UseRef count: {count}</div>;
};
```

`useRef` 只接受一个参数，就是 初始值，之后可以通过赋值 `ref.current` 来更改，我们可以将一些不影响组件声明周期的参数放在 ref 中，还可以将 ref 直接传递给子组件，子元素。

```javascript
const ref = useRef();

<div ref={ref}>Hello</div>
// or
<Child ref={ref} />
```

或许有同学这时候会想到，当子组件为 Class 组件时，ref 获取的是 Class 组件的实例，上面包含 Class 的所有方法属性等。但当子组件为 Function 组件时，ref 能拿到什么，总不可能是 function 内定义的方法、变量。

### useImperativeHandle

```javascript
import React, { useRef, useState, useImperativeHandle } from "react";

const App = () => {
  const ref = useRef();
  return <Child ref={ref} />;
};

const Child = React.forwardRef((props, ref) => {
  const inputRef = useRef();
  const [value, setValue] = useState(1);

  useImperativeHandle(ref, () => ({
    value, // 内部变量
    setValue, // 方法
    input: inputRef.current, // Ref
  }));

  return <input value={value} inputRef={inputRef} />;
});
```

使用 `useImperativeHandle` 钩子可以自定义将子组件中任何的变量，挂载到 ref 上。`React.forwardRef` 方法可以让组件能接收到 ref ，然后再使用或者透传到更下层。

### useCallback

```javascript
import React, { useCallback } from "react";

const Component = () => {
  const setUserInfo = (payload) => {}; // request api

  const updateUserInfo = useCallback(
    (payload) => {
      setUserInfo(Object.assign({}, userInfo, payload));
    },
    [userInfo]
  );

  return <UserCard updateUserInfo={updateUserInfo} />;
};
```

useCallback 会在二个参数的依赖项发生改变后才重新更新，如果将此函数传递到子组件时，每次父组件渲染此函数更新，就会导致子组件也重新渲染，可以通过传递第二个参数以避免一些非必要性的渲染。

### useMemo

```javascript
import React, { useMemo } from "react";

const Component = () => {
  const [count, setCount] = useState(0);

  const sum = useMemo(() => {
    // 求和逻辑
    return sum;
  }, [count]);

  return <div>{sum}</div>;
};
```

useMemo 的用法跟 useCallback 一样，区别就是一个返回的是缓存的方法，一个返回的是缓存的值。上述如果依赖值 count 不发生变化，计算 sum 的逻辑也就只会执行一次，从而性能。

> 这是之后更新的：[useCallback 与 useMemo 详解](https://juejin.im/post/6844904101445124110) 欢迎阅读。

## React Redux Hooks

### useSelector

```javascript
import { shallowEqual, useSelector } from "react-redux";

const Component = () => {
  const userInfo = useSelector((state) => state.userInfo, shallowEqual);

  // ...
};
```

useSelector 的第二个参数是一个比较函数，useSelector 中默认使用的是 `===` 来判断两次计算的结果是否相同，如果我们返回的是一个对象，那么在 useSelector 中每次调用都会返回一个新对象，所以所以为了减少一些没必要的 `re-render`，我们可以使用一些比较函数，如 react-redux 自带的 `shallowEqual`，或者是 Lodash 的 `_.isEqual()`、Immutable 的比较功能。

### useDispatch

```javascript
import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

const Compnent = () => {
  const dispatch = useDispatch();
  const clearUserInfo = useCallback(
    () => dispatch({ type: 'clearUserInfo' }),
    [dispatch]
  );

  return (
    <button onClick={clearUserInfo}>click</buttn>
  )
}
```

使用 `dispatch` 来调度操作，加上 `useCallback` 来减少不必要的渲染。

## React Router Hooks

### useHistory

```javascript
import { useHistory } from 'react-router';

const Compnent = () => {
  const history = useHistory();

  return (
    <button onClick={() => history.push('/home')}>go home</buttn>
  )
}
```

### useLocation

```javascript
import React, { useEffect } from "react";
import { useLocation } from "react-router";

const Compnent = () => {
  const location = useLocation();

  useEffect(() => {
    // ...
  }, [location]);
};
```

URL 一发生变化，将返回新的 `location` ，一般可以用来监听 `location.search` 。

### useParams

```javascript
import { useParams, useEffect } from "react-router";

const Component = () => {
  const params = useParams();

  const getUserInfo = (id) => {
    // request api
    // some event
  };
  useEffect(() => {
    // parms 的 uid 发生变化就会重新请求用户信息
    getUserInfo(params.uid);
  }, [params.uid]);

  // ...
};
```

useParams 返回 react-router 的参数键值对

### useRouteMatch

```javascript
import { useRouteMatch } from "react-router";

const Component = () => {
  const match = useRouteMatch("/login");

  // ...
};
```

useRouteMatch 可以传入一个参数 `path`，不传参数则返回当前路由的参数信息，如果传了参数则用来判断当前路由是否能匹配上传递的 `path`，适用于判断一些全局性组件在不同路由下差异化的展示。

### 结语

使用 Hooks 能为开发提升不少效率，但并不代表就要抛弃 Class Component，依旧还有很多场景我们还得用到它，比如需要封装一个公共的可继承的组件，当然通过自定义 hooks 也能将一些共用的逻辑进行封装，以便再多个组件内共用。

推荐一篇我后来写的文章吧 [在 React 中自定义 Hooks 的应用场景](https://juejin.im/post/6864871906567749645) ，此篇文章主要讲一些 Hooks 的高阶应用。

参考

- [React Hooks](https://reactjs.org/docs/hooks-intro.html)
- [React Redux Hooks](https://react-redux.js.org/api/hooks)
- [React Router Hooks](https://reacttraining.com/react-router/web/api/Hooks)
