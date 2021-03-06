function checkIsWorking() {
  return Math.random() < 0.5;
}

function getWorkers() {
  return new Promise(resolve => {
    setTimeout(() => resolve([{
      name: 'Денис Мартынов',
      isWorking: checkIsWorking()
    }, {
      name: 'Окунцев Юрий',
      isWorking: checkIsWorking()
    }, {
      name: 'Александр Богатиков',
      isWorking: checkIsWorking()
    }, {
      name: 'Денис Крылов',
      isWorking: checkIsWorking()
    }]), 1000);
  });
}

const ReactClone = {
  createElement: (type, props, ...children) => ({
    type,
    props: { ...props,
      children: children.length === 1 ? children[0] : children
    }
  })
};
let state = {
  time: new Date(),
  workers: null
};

function Header() {
  return ReactClone.createElement("header", null, ReactClone.createElement(Logo, null));
}

function Logo() {
  return ReactClone.createElement("img", {
    src: "public/images/logo.png",
    alt: "kozhindev.com"
  });
}

function Main({
  props
}) {
  return ReactClone.createElement("main", null, ReactClone.createElement(Title, null), ReactClone.createElement(Article, {
    time: props.time,
    workers: props.workers
  }));
}

function Title() {
  return ReactClone.createElement("h1", null, "KozhinDev");
}

function Article({
  time,
  workers
}) {
  return ReactClone.createElement("article", null, ReactClone.createElement(WorkTime, null), ReactClone.createElement(CurrentTime, {
    time: time
  }), ReactClone.createElement(Status, {
    time: time
  }), ReactClone.createElement(Workers, {
    workers: workers
  }));
}

function WorkTime() {
  return ReactClone.createElement("p", null, "\u0427\u0430\u0441\u044B \u0440\u0430\u0431\u043E\u0442\u044B: \u0441 8:00 \u0434\u043E 19:00");
}

function CurrentTime({
  time
}) {
  return ReactClone.createElement("small", {
    className: "CurrentTime"
  }, 'Сейчас: ' + time.toLocaleTimeString());
}

function Status({
  time
}) {
  return ReactClone.createElement("strong", {
    className: "Status"
  }, time.getHours() < 8 || time.getHours() > 19 ? ' Закрыто' : ' Открыто');
}

function Workers({
  workers
}) {
  if (!workers) {
    return ReactClone.createElement("div", null, "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430...");
  }

  return ReactClone.createElement("div", null, workers.filter(worker => worker.isWorking).map(worker => ReactClone.createElement("div", {
    key: worker.name
  }, worker.name + '   ')));
}

function App({
  state
}) {
  return ReactClone.createElement("div", {
    className: 'App'
  }, ReactClone.createElement(Header, null), ReactClone.createElement(Main, {
    props: state
  }));
}

setInterval(() => {
  getWorkers().then(workers => {
    state = { ...state,
      workers
    };
  });
  state = { ...state,
    time: new Date()
  };
  render(ReactClone.createElement(App, {
    state: state
  }), document.getElementById('root'));
}, 1000);
render(ReactClone.createElement(App, {
  state: state
}), document.getElementById('root'));

function render(virtualDOM, realDOMRoot) {
  const interpretVirtualDOM = interpret(virtualDOM);
  const virtualDOMRoot = {
    type: realDOMRoot.tagName.toLowerCase(),
    props: {
      children: [interpretVirtualDOM]
    }
  };
  sync(virtualDOMRoot, realDOMRoot);
}

function interpret(virtualNode) {
  if (typeof virtualNode !== 'object') {
    return virtualNode;
  }

  if (typeof virtualNode.type === 'function') {
    return interpret(virtualNode.type(virtualNode.props));
  }

  const props = virtualNode.props || {};
  return { ...virtualNode,
    props: { ...props,
      children: Array.isArray(props.children) ? props.children.map(interpret) : [interpret(props.children)]
    }
  };
}

function sync(virtualNode, realNode) {
  // Синхронизация пропсов
  if (virtualNode.props) {
    Object.entries(virtualNode.props).forEach(([name, value]) => {
      if (name === 'key' || name === 'children') {
        return;
      }

      if (realNode[name] !== value) {
        realNode[name] = value;
      }
    });
  } // debugger
  // случай для пограничного состояния, когда вместо полноценного узла приходит Node.TEXT_NODE


  if (typeof virtualNode !== 'object' && virtualNode !== realNode.nodeValue) {
    realNode.nodeValue = virtualNode;
  } // Синхронизация дочерних узлов


  const virtualChildren = virtualNode.props ? virtualNode.props.children || [] : [];
  const realChildren = realNode.childNodes;

  for (let i = 0; i < virtualChildren.length || i < realChildren.length; i++) {
    const virtual = virtualChildren[i];
    const real = realChildren[i]; // Если виртуального узла нет, а реальный есть - удаляем

    if (virtual === undefined && real !== undefined) {
      realNode.remove(real);
    } // Если виртуальный и реальный дом - один и тот же HTML тэг, то мы их синхронизируем


    if (virtual !== undefined && real !== undefined && (virtual.type || '') === (real.tagName?.toLowerCase() || '')) {
      sync(virtual, real);
    } // Если тэги ни совпадают, то мы создаем такой тэг и синхронизируем с виртуальным


    if (virtual !== undefined && real !== undefined && (virtual.type || '') !== (real.tagName?.toLowerCase() || '')) {
      const newReal = constructRealNodeByVirtualNode(virtual);
      sync(virtual, newReal);
      realNode.replaceChild(newReal, real);
    } // Добавление нового узла


    if (virtual !== undefined && real === undefined) {
      const newReal = constructRealNodeByVirtualNode(virtual);
      sync(virtual, newReal);
      realNode.appendChild(newReal);
    }
  }
}

function constructRealNodeByVirtualNode(virtualNode) {
  return typeof virtualNode !== 'object' ? document.createTextNode('') : document.createElement(virtualNode.type);
}