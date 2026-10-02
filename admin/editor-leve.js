(function () {
  'use strict';

  const listWidget = window.CMS.getWidget('list');
  const simpleWidgets = new Set(['string', 'text', 'image', 'file', 'select', 'number', 'boolean']);
  const stableProps = [
    'field', 'value', 'fieldsMetaData', 'fieldsErrors', 'mediaPaths',
    'config', 'collection', 'locale', 't', 'isDisabled', 'isHidden',
    'isSelected', 'isLoadingAsset', 'isFetching', 'queryHits'
  ];

  function sameValue(a, b) {
    if (a === b) return true;
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.length === b.length && a.every((value, index) => value === b[index]);
    }
    return Boolean(a && typeof a.equals === 'function' && a.equals(b));
  }

  function optimizeClosedFields(connectedControl) {
    // Na versão 3.8.3, connect envolve o tradutor, que cria o EditorControl.
    // Se essa estrutura mudar, o painel mantém o comportamento padrão.
    let EditorControl;
    try {
      const translated = connectedControl.WrappedComponent;
      const consumer = translated({});
      EditorControl = consumer.props.children(() => '').type;
    } catch (_) {
      return;
    }
    const prototype = EditorControl && EditorControl.prototype;
    if (!prototype || typeof prototype.render !== 'function' || prototype.shouldComponentUpdate) return;

    prototype.shouldComponentUpdate = function (nextProps, nextState) {
      const current = this.props;
      const field = current.field;
      if (
        current.collection.get('name') === 'blog' &&
        simpleWidgets.has(field.get('widget')) && !field.get('meta') &&
        current.isParentListCollapsed === true && nextProps.isParentListCollapsed === true &&
        this.state === nextState &&
        sameValue(current.parentIds, nextProps.parentIds) &&
        stableProps.every(key => sameValue(current[key], nextProps[key]))
      ) {
        // Valores e validação continuam montados. Abrir a memória atualiza
        // também os callbacks, inclusive depois de mudar a ordem da lista.
        return false;
      }
      return true;
    };
  }

  class MemoryListControl extends listWidget.control {
    constructor(props) {
      super(props);
      optimizeClosedFields(props.editorControl);
    }
  }

  window.CMS.registerWidget('list', MemoryListControl, listWidget.preview, listWidget.schema);
})();
