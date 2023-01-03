---
layout: post
title: 在 React 中自定义 Hooks 的应用场景
description: 自定义 Hooks 其实就是在现有 React 提供的 Hooks 上做一层封装，实现一些更有针对性的逻辑，或者可以将一些比较通用的业务逻辑做一个封装。
tags: JavaScript React
bannerImg: /static/images/bg4.jpg
---

<!--more-->

## 前言

> 阅读本篇文章需掌握 React Hooks 基本用法、我的这篇文章内有大致介绍 [在 React 项目中全量使用 Hooks](/2020/03/16/React-use-Hooks.html) 欢迎阅读。

自定义 Hooks 其实就是在现有 React 提供的 Hooks 上做一层封装，实现一些更有针对性的逻辑，或者可以将一些比较通用的业务逻辑做一个封装。

## Class 组件的生命周期

下面将列举一些我们在 Class 组件内常用的生命周期如何用 Hooks 来实现。

### componentDidMount

我们都知道 `useEffect` 的第二个参数如果传一个空数组，那么 useEffect 的第一个参数（函数）将只会执行一遍，那么我们就可以借此实现一个类似于 componentDidMount 的 Hooks

```javascript
const useDidMount = (callback) => {
  useEffect(callback, []);
};
```

上述就属于一个简单的自定义 Hooks，只需要在需要用的组件将其 `import` 进去使用即可。

### componentDidUpdate

在一些情况我们只需要监听组件的更新情况，而不关心最初的一次 Mount，而 `useEffect` 在不传第二个参数时是无论组件初次渲染或者更新都会执行，我们可以想到使用一个值来维护是否初始状态，进行判断哪从而实现 Update 的效果。

这个值首要的功能就是能在组件的各个生命周期都能拿到，这里就可以考虑使用 `useState` 或者 `useRef` 来维护这样一个初始状态。再考虑到 useState 的值发生变更，只能在组件下一次渲染时所拿到最新的，而且我们这个初始状态的变更其实是不影响组件的更新，所以我们可以使用 `useRef` 来维护这样一个状态。

```javascript
const useDidUpdate = (callback, inputs) => {
  const initial = useRef(true);

  useEffect(() => {
    if (initial.current) {
      initial.current = false;
      return;
    }
    callback?.();
  }, inputs);
};
```

上述使用 `useRef` 来维护了一个 `initial` 变量用来判断是否为初始渲染，还效仿 `useEffect` 支持了一个 `inputs` 参数，以便实现，针对那些值来更新效果，如果不传 `inputs` 参数那么无论是 Props 或者 State 的更新导致了组件的重新渲染都会执行到 `callback` 方法。

> 有关实现 Class 组件的生命周期就讲到这里，剩下基本都差不多。下面再列举一些简单的小 🌰，看看还有那些场景能用到自定义 Hooks。

## 自定义 Hooks 的其他应用场景

### 🌰 useValues

先上个在线的 Demo 链接方便看：[CodeSandbox](https://codesandbox.io/s/react-hooks-iu15t?file=/src/Components/UseState.jsx)

```javascript
const [state, setState] = useState({
  name: "jace",
  intro: "emmm",
});

// 只更新 name 字段
setState({
  ...state,
  name: "jack",
});
```

我们再使用 `useState` 时经常会有只需要更新 `state` 对象内某一个属性时，还需要将其他不更改的数据在传入进去，这样在使用量很多的时候写起来也麻烦，代码也不好看。我们想要的是一次性更新一个或者多个属性，其他属性依旧保持不变，那可以按照这个需求来封装一个 Hooks。

```javascript
const useValues = (initialValue) => {
  const [values, setValues] = useState(initialValue);

  const updateValues = useCallback(
    (_values) => {
      if (typeof _values !== "object") {
        return console.warn("values required type is object!");
      }
      setValues(Object.assign({}, values, _values));
    },
    [values]
  );

  return [values, updateValues];
};
```

上述实现了一个跟 `useState` 很类似的 Hooks，区别是，返回的更新值的方法会在上一次的值的基础上更新，这里有使用一个 `useCallback` 方法对我们的更新函数做了一个缓存，不太了解 `useCallback` 的具体应用场景可以看看我的另一篇文章：[详解 useCallback & useMemo](/2020/03/24/React-useCallback-&-useMemo.html)。

接下来再有上述需求的时候就可以把 `useValues` 方法引入到组件内使用。

```javascript
const [state, setState] = useValues({
  name: "jace",
  intro: "emmm",
});

// 只更新 name 字段
setState({
  name: "jack",
});
```

或许还有些情况我们需要更新 `state` 的所有的属性，而不是某个别，那么我们可以再增加一个返回的方法，用来覆盖 `state`。

```javascript
const useValues = (initialValue) => {
  const [values, setValues] = useState(initialValue);

  const updateValues = useCallback(
    (_values) => {
      if (typeof _values !== "object") {
        return console.warn("values required type is object!");
      }
      setValues(Object.assign({}, values, _values));
    },
    [values]
  );

  /**
   * 这里 useCallback 所依赖的外部变量 setValues 不会变；
   * initialValue 我们不需要他会变，只用最初状态就可以，所以 useCallback 不需要传入依赖项。
   */
  const forceValues = useCallback((_values) => {
    setValues(_values || initialValue);
  }, []);

  return [values, updateValues, forceValues];
};
```

我们增加了 `forceValues` 方法作为返回数组的第三项，用来更新整个 `values`。有时候我们还需要将 `values` 重置为初始化的值，这里也增加了一个逻辑，如果 `forceValues` 没传参数则会初始化，传了参数则会覆盖整个 `values`。

### 🌰 useCancelTimer

在写 React 项目中应该有不少同学会碰到这种警告：

```javascript
Warning:
Can't perform a React state update on an unmounted component. This is a no-op,
but it indicates a memory leak in your application. To fix,
cancel all subscriptions and asynchronous tasks in a useEffect cleanup function.
```

从报错中就可以看到，我们可以看出这是因为组件已经被卸载，但是组件的异步任务还没取消，等到异步任务完成再调用组件的方法，就会抛出这样一个警告。如果我们是将所有数据存储在组件外面呢，获取数据也是通过组件外面的方法进行获取、存储的话那应该是遇不到这种问题（redux/saga/dva）。

这里我们讲一下在组件内遇到这种问题改如何解决，可以想到这是一个很通用的操作，每一个组件内都有可能会进行一些异步任务，异步任务在结束是都有可能面临这个问题。可以看看这个在线 Demo [useCancelTimer](https://codesandbox.io/s/react-hooks-iu15t?file=/src/Components/UseCancelTimer.jsx)。

```jsx
const Content = ({ onClose }) => {
  const [name, setName] = useState("");

  useEffect(() => {
    request();
  }, []);

  const request = () => {
    return setTimeout(() => {
      setName("jace");
    }, 2000);
  };

  return (
    <div>
      <button onClick={onClose}>Close</button>
      <div>name: {name}</div>
    </div>
  );
};

const UseCancelTimer = () => {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <button onClick={() => setVisible(true)}>Show</button>
      {visible && <Content onClose={() => setVisible(false)} />}
    </div>
  );
};
```

在 `Content` 组件挂载时就会去请求一个异步任务，异步任务会获取一个数据并进行 `setState` ，如果我们再异步任务执行结束之前点击 Close 按钮，导致组件被卸载，那么在 Console 中就会抛上述错误。

我们要想一个如何解决这个问题的方法，考虑到每个组件会请求不同的方法，且组件卸载也只清除在这个组件实例运行时所发起的那些异步方法，（与生命周期挂钩，需要维护组件内部状态）这种需求就很符合 Hooks 的设计，那我们就可以使用自定义 Hooks 将这一部分逻辑抽出，在哪个组件需要就引入使用。

```javascript
// useCancelTimer.js
const useCancelTimer = () => {
  const requests = useRef([]); // 存储每个异步方法标识

  useEffect(() => {
    return () => {
      // 组件卸载时清除
      requests.current.forEach(clearTimeout);
    };
  }, []);

  return useCallback((timer) => {
    // 使用该方法包裹每一个异步请求
    requests.current.push(timer);
  }, []);
};
```

```javascript
// Content.jsx
const Content = () => {
  const addTimer = useCancelTimer();
  const [data, setData] = useState({});

  useEffect(() => {
    addTimer(request()); // 使用该方法包裹每一个异步请求
  }, []);

  const request = () => {
    return setTimeout(() => {
      console.log("reslove");
      setData({
        name: "jace",
      });
    }, 2000);
  };
};
```

这是一个很简单的自定义 Hooks 也很好理解，在组件内维护一个异步请求列表，在组件卸载时取消所有的异步操作，返回的方法就是用来记录异步请求的。

### 🌰 useRequest

上述案是使用的计时器，要处理具体业务中所使用的异步请求方法也大差不差，同样的逻辑，这里再分享一个我基于 Axios 来实现的案例：线上地址 [useRequest](https://codesandbox.io/s/react-hooks-iu15t?file=/src/hooks/useRequest.js)

```javascript
const useRequest = () => {
  const requests = useRef({});
  const [loading, setLoading] = useState(false); // 顺单维护一个组件内所需要的 loading 状态

  useEffect(() => {
    return () => {
      // 组件卸载取消所有正在进行中的异步请求
      const { current } = requests;
      for (let key in current) {
        current.hasOwnProperty(key) && current[key]?.("cancel");
      }
    };
  }, []);

  return [
    async (config, showLoading = true) => {
      // 规定组件内所有请求都通过 此方法来发送以便维护
      if (showLoading) {
        !loading && setLoading(true);
      }
      const _id = getRandomId(); // 随机生成一个字符串ID
      const promise = axios(
        Object.assign({}, config, {
          cancelToken: new axios.CancelToken((cancel) => {
            Object.assign(requests.current, {
              // 存下取消每个异步请求需要的方法
              [_id]: cancel,
            });
          }),
        })
      );

      let error = false;
      let res = null;

      try {
        res = await promise;
      } catch (err) {
        // 这里因为组件已经卸载了，就直接返回，不走下面的逻辑了
        if (err instanceof Axios.Cancel) {
          return [err, res];
        }
        error = err;
      }

      delete requests.current[_id];
      if (isEmpty(requests.current)) {
        setLoading(false);
      }

      return [error, res];
    },
    loading,
  ];
};
```

## 最后

本篇主要还是针对业务来讲，列举一些业务中可以优化的点，我也很喜欢将业务遇到的东西进行分享。很早之前就打算搞一个针对自定义 Hooks 的开源库，不过前阵子发现阿里好像有一个了 😅 [ahooks](https://github.com/alibaba/hooks)，这应该是更基础或者更通用型的一些 Hooks 封装。等有空建一个更偏向业务的 Hooks Demo 合集仓库以供学习，寻找灵感吧。

有问题欢迎提问，有文章 BUG 欢迎指正，感谢阅读。
