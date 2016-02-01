/**
 * DOM操作常用功能原生JS封装
 * 
 * 
 * @authors 马硕
 * @startDate    2015-07-03 20:56
 * @repairDate   2015-11-14 19:04
 * @version 0.10.0
 */

;(function (window,undefined){
	var node = Node.prototype,
		collection = HTMLCollection.prototype,
		nodeList = NodeList.prototype,
		stringProto = String.prototype,
		arrayProto = Array.prototype,
		$;

/*---------------------------- DOM对象扩展 ----------------------------*/
	//选取有指定条件的最近父级
	node.Closest = function(condition,scope) {
		/*
			使用方法:
			1.element.Closest('.className');
			2.element.Closest('#id');
			3.element.Closest('tagName');
			4.element.Closest('.className').On('click',fnName1)....;
			  *此时执行on事件的元素为选取后的元素非初始元素
			5.element.Closest('条件','范围');
		 */
		var _self = this,
			_condition = condition, //查找条件
			_scope = scope, //查找范围
			_parNode = _self.parentNode,
			_ele = null;

		//没有参数或已经为根节点则返回null
		if (!_condition || _self.tagName == 'HTML') return null;

		//限定范围
		if (_scope) {
			switch (_scope.charAt(0)) {
				case '.':
					var _scopeClass = new RegExp('\\b' + _scope.substring(1) + '\\b');
					if (_scopeClass.test(_parNode.className)) return null;
					break;
				case '#':
					if (_parNode.id == _scope.substring(1)) return null;
					break;
				default:
					if (_parNode.tagName == _scope) return null;
					break;
			};
		};

		//通过参数首字符判断选择器类型
		_ele = _condition._Choose(function(reg){
			if (reg.test(_parNode.className)) {
				return _parNode;
			} else {
				//递归查找父级的父级节点
				return _parNode.Closest(_condition);
			};
		},function(id){
			if (id === _parNode.id) {
				return _parNode;
			} else {
				//递归查找父级的父级节点
				return _parNode.Closest(_condition);
			};
		},function(tag){
			if (tag === _parNode.tagName) {
				return _parNode;
			} else {
				//递归查找父级的父级节点
				return _parNode.Closest(_condition);
			};
		});

		return (_ele instanceof HTMLElement) ? _ele : null;
	};

	//选取有指定条件的最外层父级
	node.Furthest = function(scope) {
		/*
			使用方法:
			1.element.Furthest('.className');
			2.element.Furthest('#id');
			3.element.Furthest('tagName');
			4.element.Furthest('.className').On('click',fnName1)....;
			  *此时执行on事件的元素为选取后的元素非初始元素
		 */
		var _self = this,
			_scope = scope,
			_elements = [], //满足条件的节点容器
			_closestPar = null; //选取的符合条件的节点

		//递归查找并存入符合条件的节点
		(function _fn(arug) {
			//当查找到根节则点返回null(_self的值来源于closest函数最终返回值);
			if (!_self) return null;

			//防止浏览器自带closest功能查找自身Bug
			if (_self == _closestPar) _self = _self.parentNode;

			//如果查找的节点父级为根节点则返回null
			if (_self == document) return null;

			//获取满足条件的最近的父级
			_closestPar = _self.Closest(arug);

			//将满足条件的最近的父级设置为下一次搜索起始位置
			_self = _closestPar;

			//将满足条件的父级存入数组
			_elements.push(_closestPar);

			//递归循环执行本函数
			return _fn(arug);
		})(_scope);

		//翻转数组
		_elements = _elements.reverse();

		//判断数组内部数据
		return _elements[0] ? _elements[0] : (_elements[1] ? _elements[1] : null);
	};

	//移除class
	node.RemoveClass = function(classNames) {
		/*
			使用方法:
			1.element.RemoveClass();
			2.element.RemoveClass('className');
			3.element.RemoveClass('className1').RemoveClass('className2')....;
		 */
		var _self = this,
			_classNames = classNames,
			_classNameArr = null,
			_selfClass = null,
			_classReg = null;

		if (Type(_classNames) !== 'String' || _classNames === undefined) return _self.removeAttribute('class'),_self;

		if (_classNames) {
			_selfClass = _self.className;
			_classNameArr = _classNames.split(' ');

			for(var i=0;i<_classNameArr.length;i++){
				if(!_classNameArr[i]) continue;
				_classReg = new RegExp('\\b'+_classNameArr[i]+'\\b');
				_selfClass = _selfClass.replace(_classReg,'').Trim().replace(/\s+/g,' ');
			}
			_self.className = _selfClass;
		};
		return _self;
	};

	//增加class
	node.AddClass = function() {
		/*
			使用方法:
			1.element.AddClass('className');
			2.element.AddClass('className1','className2',...);
			3.element.AddClass('className1').AddClass('className2')....;
		 */
		var _self = this,
			_classNames = arguments,
			_className = '',
			_classReg;
		
		if(_classNames.length <= 0) return _self;//参数为空返回自身

		//一个参数形式
		if(_classNames.length == 1 && Type(_classNames[0]) == 'String'){
			_classReg = new RegExp('\b'+_classNames[0] +'\b');

			if(!_classReg.test(_self.className)){
				_className = _classNames[0].Trim().replace(/\s+/,' ');//去多余空格
				_self.className += (' '+_className);
			}
			
			return _self;
		}
		//多个参数形式
		else{
			for(var i=0;i<_classNames.length;i++){//循环参数对象
				_classReg = new RegExp('\\b'+_classNames[i]+'\\b');
				_newClass = '';

				//如果 参数不是字符串 || 不存在 || 已存在 则跳过本次循环
				if (Type(_classNames[i]) !== 'String' || !_classNames[i] || _classReg.test(_self.className)){
					continue
				}
				//否则插入新className
				else{
					_self.className += (' '+_classNames[i]);
				};
			};
		}
		return _self;
	};

	//事件绑定
	node.On = function(events,fn,deep) {
		/*
			使用方法:
			1.element.On('click',fnName);
			2.element.On('click',fnName1).On('mouseover',fnName2).....;
			3.element.On('click mouseover',fnName);
			4.element.On('click',fnName,true);
		 */
		var _self = this,
			_events = events,
			_fn = fn,
			_eventsArr = null
			_deep = deep || false;

		if (!_events || !_fn) return _self;

		_eventsArr = _events.split(' ');

		for(var i=0;i<_eventsArr.length;i++){
			if(!_eventsArr[i]) continue;
			if (_self.addEventListener || _self.attachEvent) {
				if (_self.addEventListener) {
					_self.addEventListener(_eventsArr[i], _fn, _deep);
				} else if (_self.attachEvent) {
					_self.attachEvent('on' + _eventsArr[i], _fn);
				};

				if (_self._eventListeners && _self._eventListeners[_eventsArr[i]]) {
					_self._eventListeners[_eventsArr[i]].push(_fn);
				} else {
					if (!_self._eventListeners)(_self._eventListeners = {});

					_self._eventListeners[_eventsArr[i]] = [_fn];
				};
			} else {
				_self['on' + _eventsArr[i]] = _fn;
			};
		};

		return _self;
	};

	//解除事件绑定
	node.Off = function(events,fn,deep) {
		/*
			使用方法:
			1.element.Off('click',fnName);
			2.element.Off('click',fnName1).Off('mouseover',fnName2)....;
		 */
		var _self = this,
			_events = events,
			_fn = fn,
			_deep = deep || false;

		if (!_events) return _self;
		_eventsArr = _events.split(' ');

		for(var i = 0; i < _eventsArr.length; i++){
			if(!_eventsArr[i]) continue;
			if ((_self.removeEventListener || _self.detachEvent) && _self._eventListeners) {
				var eventListeners = _self._eventListeners[_eventsArr[i]];
				if (!eventListeners) return;

				if (_fn) {
					if (_self.removeEventListener) {
						_self.removeEventListener(_eventsArr[i], _fn, _deep);
					} else if (_self.detachEvent) {
						_self.detachEvent('on' + _eventsArr[i], _fn);
					};

					if (_self._eventListeners[_eventsArr[i]]) {
						var idx = _self._eventListeners[_eventsArr[i]].indexOf(_fn);
						if (idx >= 0) {
							_self._eventListeners[_eventsArr[i]].splice(idx, 1);
						};
					};
				} else {
					for (var j = 0; j < eventListeners.length; j++) {
						var func = eventListeners[j];
						if (_self.removeEventListener) {
							_self.removeEventListener(_eventsArr[i], func, _deep);
						} else if (_self.detachEvent) {
							_self.detachEvent('on' + _eventsArr[i], func);
						};
					};
					delete _self._eventListeners[_eventsArr[i]];
				};
			} else if (_self['on' + _eventsArr[i]]) {
				_self['on' + _eventsArr[i]] = null;
			};
		};

		return _self;
	};

	//插入元素(父级插入新元素)
	node.Append = function(element) {
		/*
			使用方法:
			1.elementParent.Append(elementChild);
			2.elementParent.Append(elementChild).On('click',fnName);
		 */
		var _self = this;
		if (arguments[0] instanceof HTMLElement) {
			_self.appendChild(element);
		} else {
			return _self;
		};
		return _self;
	};

	//插入元素(子元素插入到父级)
	node.AppendTo = function(element) {
		/*
			使用方法:
			1.elementChild.AppendTo(elementParent);
			2.elementChild.AppendTo(elementParent).On('click',fnName);
		 */
		var _self = this;
		if (arguments[0] instanceof HTMLElement) {
			element.appendChild(_self);
		} else {
			return _self;
		};
		return _self;
	};

	//移除元素(符合条件的子集)
	node.Remove = function(element) {
		/*
			使用方法:
			1.element.Remove('.class');
			2.element.Remove('#id');
			3.element.Remove('div');
			4.elementParent.Remove(elementChild);
			5.element.Remove();
			6.element.Remove('div').On('click',fnName);
		 */
		var _self = this,
			_ele = element,
			_elements = [];

		if (_ele instanceof HTMLElement) { //参数为dom对象
			_self.removeChild(_ele);
			return _self;

		} else if (Type(_ele) == 'String') { //参数为字符串

			var _children = _self.children;

			_ele._Choose(function(reg){
				for (var i = 0; i < _children.length; i++) {
					if (reg.test(_children[i].className)) {
						_self.removeChild(_children[i]);
						i--;
					};
				};
			},function(id){
				for (var i = 0; i < _children.length; i++) {
					if (id === _children[i].id) {
						_self.removeChild(_children[i]);
						i--;
					};
				};
			},function(tag){
				for (var i = 0; i < _children.length; i++) {
					if (tag === _children[i].tagName) {
						_self.removeChild(_children[i]);
						i--;
					}
				};
			});

			return _self;
		} else if (_ele === undefined) { //没有参数
			//如果自身是document或HTML或BODY则返回自身
			if (_self instanceof DocumentType || _self.tagName == 'HTML' || _self.tagName == 'BODY') {
				return _self;
			}else{
				var _selfPar = _self.parentNode;
				_selfPar.removeChild(_self); //删除本身
				return _selfPar; //返回删除元素的父级
			}
		} else {
			return _self;
		};
	};

	//清空元素
	node.Empty = function() {
		/*
			使用方法:
			1.element.Empty();
			2.element.Empty().On('click',fnName);
		 */
		var _self = this;
		//如果自身是document或HTML则返回自身
		if (_self instanceof DocumentType || _self.tagName == 'HTML') {
			return _self;
		}
		//否则清空元素
		else {
			_self.innerHTML = '';
			return _self;
		}
	};

	//克隆元素
	node.Clone = function(deep) {
		/*
			使用方法:
			1.element.Clone();
			2.element.Clone(true);
			3.elementChild.Clone(true).AppendTo(elementParent)....;
		 */
		var _self = this,
			_deep = deep,
			_newEle = null;

		//如果自身是document或HTML或BODY则返回自身
		if (_self instanceof DocumentType || _self.tagName == 'HTML' || _self.tagName == 'BODY') {
			return _self;
		};

		if (_deep) {
			_newEle = _self.cloneNode(true);
			//克隆元素事件
			if(_self._eventListeners){
				_newEle._eventListeners = _self._eventListeners;
			}
			return _newEle;
		} else {
			return _self.cloneNode();
		};
	};

	//选取上一个兄弟节点
	node.Next = function(condition) {
		/*
			使用方法:
			1.element.Next('.className');
			2.element.Next('#id');
			3.element.Next('tagName');
			4.element.Next('.className').On('click',fnName1)....;
			  *此时执行on事件的元素为选取后的元素非初始元素
		 */
		var _self = this,
			_condition = condition,
			_next = _self.nextElementSibling || _self.nextSibling,
			_ele = null;

		//不存在下一个节点 || 下一个节点不是DOM节点
		if (!_next || (_next && _next.nodeType == 3)) return null;

		if (_condition && Type( _condition) == 'String') {

			//没有参数或已经为根节点则返回null
			if (!_condition) return null;

			//通过参数首字符判断选择器类型
			_ele = _condition._Choose(function(reg){
				if (reg.test(_prev.className)) {
					return _next;
				} else {
					//递归查找后节点的后节点
					return _next.Next(_condition);
				};
			},function(id){
				if (id === _next.id) {
					return _next;
				} else {
					//递归查找后节点的后节点
					return _next.Next(_condition);
				};
			},function(tag){
				if (tag === _next.tagName) {
					return _next;
				} else {
					//递归查找后节点的后节点
					return _next.Next(_condition);
				};
			});

			return (_ele instanceof HTMLElement) ? _ele : null;
		};

		return _next;
	};

	//选取下一个兄弟节点
	node.Prev = function(condition) {
		/*
			使用方法:
			1.element.Prev('.className');
			2.element.Prev('#id');
			3.element.Prev('tagName');
			4.element.Prev('.className').On('click',fnName1)....;
			  *此时执行on事件的元素为选取后的元素非初始元素
		 */
		var _self = this,
			_condition = condition,
			_prev = _self.previousElementSibling || _self.previousSibling,
			_ele = null;

		if (!_prev || (_prev && _prev.nodeType == 3)) return null;

		if (_condition && Type(_condition) == 'String') {

			//没有参数或已经为根节点则返回null
			if (!_condition) return null;

			_ele = _condition._Choose(function(reg){
				if (reg.test(_prev.className)) {
					return _prev;
				} else {
					//递归查找后节点的后节点
					return _prev.Prev(_condition);
				};
			},function(id){
				if (id === _prev.id) {
					return _prev;
				} else {
					//递归查找后节点的后节点
					return _prev.Prev(_condition);
				};
			},function(tag){
				if (tag === _prev.tagName) {
					return _prev;
				} else {
					//递归查找后节点的后节点
					return _prev.Prev(_condition);
				};
			});

			return (_ele instanceof HTMLElement) ? _ele : null;
		}

		return _prev;
	};

	//检测是否有指定class名
	node.HasClass = function() {
		/*
			使用方法:
			1.element.HasClass('className1');
			2.element.HasClass('className1','className2', ...);
		 */
		var _self = this,
			_argu = arguments,
			_len = _argu.length,
			_className,
			_classReg,
			_classArr;

		//不存在指定条件则返回flase
		if (!_argu[0]) return false;

		//一个参数
		if (_len == 1 && Type(_argu[0]) == 'String'){
			_className = _argu[0];
			_classArr = _className.split(' ');

			if(_classArr.length > 1){
				for(var i=0;i<_classArr.length;i++){
					_classReg = new RegExp('\\b' + _classArr[i] + '\\b');
					if(_classReg.test(_self.className)) return true;
				}
			}else{
				_classReg = new RegExp('\\b' + _className + '\\b');
				if(_classReg.test(_self.className)) return true;
			}
		}
		else if(_len > 1){
			for(var i=0;i<_len;i++){
				if(Type(_argu[i]) !== 'String') continue;
				_classReg = new RegExp('\\b' + _argu[i] + '\\b');
				if(_classReg.test(_self.className)) return true;
			}
		}
		return false;
	};

	//获取设置元素内容
	node.Html = function(argument) {
		/*
			使用方法:
			1.element.Html();//获取自身内容
			2.element.Html('text');//设置自身内容
			4.element.Html('text').Html();
			3.element.Html(callback); //设置自身内容(回调函数)
			5.element.Html(callback).Html();
		 */
		var _self = this,
			_argu = argument;

		//无参数返回元素内容
		if (Type(_argu) == 'Undefined') {
			return _self.innerHTML;
		}
		//参数为函数
		else if (Type(_argu) == 'Function') {
			_self.innerHTML = _argu.call(_self);
		}
		//参数为其它
		else {
			_self.innerHTML = _argu;
		}

		return _self;
	};

	//获取设置元素value
	node.Val = function(argument) {
		/*
			使用方法:
			1.element.Val();//获取自身value值
			2.element.Val('text');//设置自身value值
			4.element.Val('text').Html();
			3.element.Val(callback); //设置自身value值(回调函数)
			5..element.Val(callback).Html();
		 */
		var _self = this,
			_argu = argument;

		//无参数返回元素内容
		if (Type(_argu) == 'Undefined') {
			return _self.value;
		}
		//参数为函数
		else if (Type(_argu) == 'Function') {
			if(_self.tagName == 'TEXTAREA'){
				_self.value = _argu.call(_self);//设置实际内容(兼容textarea)
			}
			_self.setAttribute('value',_argu.call(_self));//设置属性值
		}
		//参数为其它
		else {
			if(_self.tagName == 'TEXTAREA'){
				_self.value = _argu;//设置实际内容(兼容textarea)
			}
			_self.setAttribute('value',_argu);//设置属性值
		}

		return _self;
	};

	//获取设置自定义属性
	node.Attr = function() {
		/*
			使用方法:
			1.element.Attr();//获取元素所有属性
			2.element.Attr('class');//获取元素指定自定义属性
			3.element.Attr({name1:value,name2:value});//设置自定义属性(对象方式设置)
			4.element.Attr({name1:value,name2:value}).Html();
			5.element.Attr(name,value); //设置自定义属性
			6.element.Attr(name,value).Html();
		 */
		var _self = this,
			_argu = arguments,
			_attrs = {},
			_selfAttrs,
			_tmpAttrs;

		//没有参数
		if (!_argu[0]){
			//自身所有属性
			_selfAttrs = _self.attributes;
			for(var i=0;i<_selfAttrs.length;i++){
				//属性对象[object Attr]
				_tmpAttrs = _selfAttrs[i];
				//提取所需数据
				_attrs[_tmpAttrs['name']] = _tmpAttrs['value'];
			}
			return _attrs;
		};

		//一个参数
		if (_argu.length == 1) {
			var _parameter = _argu[0];
			//字符串类型参数
			if (Type(_parameter) == 'String') {
				var _attr = _self.getAttribute(_parameter);
				return _attr;
			};
			//对象类型参数
			if (Type(_parameter) == 'Object') {
				for (var name in _parameter) {
					_self.setAttribute(name, _parameter[name]);
				};
				return _self;
			};
		}
		//两个参数
		else if (_argu.length == 2) {
			_self.setAttribute(_argu[0], _argu[1]);
			return _self;
		};

		return _self;
	};

	//移除自定义属性
	node.RemoveAttr = function() {
		/*
			使用方法:
			1.element.RemoveAttr();//移除所有自定义属性(除内置属性)
			2.element.RemoveAttr(true);//移除所有属性(包括内置属性)
			3.element.RemoveAttr('attribute');//移除指定属性
			4.element.RemoveAttr('attribute1','attribute2',...); //移除指定属性
			5.element.RemoveAttr().Html();
		 */
		var _self = this,
			_argu = arguments,
			_attrs,
			_findSame,
			_selfAttr = [
				'class', 
				'id', 
				'style', 
				'value', 
				'type', 
				'name',
				'src', 
				'href',
				'title',
				'alt',
				'content',
				'dissble',
				'checked',
				'draggable',
				'droppable',
				'contenteditable',
				'contextmenu',
				'placeholder',
				'maxlength',
				'method',
				'target',
				'action',
				'accesskey',
				'lang',
				'spellcheck',
				'translate',
				'hidden',
				'cols',
				'rows',
				'width',
				'height',
				'border',
				'cellpadding',
				'cellspacing',
				'summary',
				'rules',
				'frame'
			];

		//无参数时
		if (!_argu[0]) {
			//保留常见内置属性,其它移除
			_attrs = _self.attributes;

			//查找相同元素
			_findSame = function(obj,arr){
				for(var i = 0; i < arr.length; i++){
					if(obj == arr[i]) return true;
				}
				return false;
			};

			//移除自定义属性
			for (var i = 0; i < _attrs.length; i++) {
				if(!_findSame(_attrs[i].name,_selfAttr)){
					_self.removeAttribute(_attrs[i].name);
					i--;
				};
			};

			return _self;
		}
		else if (_argu.length == 1) {
			//参数为唯一布尔值且为true时
			if (Type(_argu[0]) == 'Boolean' && _argu[0]) {
				//移除所有属性
				var _attrs = _self.attributes;
				for (var i = 0; i < _attrs.length; i++) {
					_self.removeAttribute(_attrs[i].name);
					i--;
				}
			} else {
				var _attr = '' + _argu[0];
				_self.removeAttribute(_attr);
			};
		}
		else {
			//移除符合条件的属性
			[].forEach.call(_argu, function(arg) {
				var _attr = '' + arg;
				_self.removeAttribute(_attr);
			})
		};

		return _self;
	};

	//获取设置样式
	node.Css = function() {
		/*
			使用方法:
			1.element.Css('style');//获取所选样式
			2.element.Css({name1:value,name2:value});//设置样式(对象方式设置)
			3.element.Css({name1:value,name2:value}).Html();
			4.element.Css(name,value); //设置样式
			5.element.Css(name,value).Html();
		 */
		var _self = this,
			_argu = arguments,
			_parameter;

		//没有参数
		if (!_argu[0]) return _self;

		//一个参数
		if (_argu.length == 1) {
			_parameter = _argu[0];
			//字符串类型参数
			if (Type(_parameter) == 'String') {
				//兼容处理
				if (_self.currentStyle) {
					return _self.crurentStyle[_parameter];
				} else {
					return getComputedStyle(_self, false)[_parameter];
				}
			};
			//对象类型参数
			if (Type(_parameter) == 'Object') {
				for (var name in _parameter) {
					_self.style[name] = _parameter[name];
				};
				return _self;
			};
		} 
		//两个参数
		else if (_argu.length == 2) {
			_self.style[_argu[0]] = _argu[1];
		};

		return _self;
	};

	//显示元素
	node.Show = function() {
		/*
			使用方法:
			1.element.Show();
			5.element.Show().Html();
		 */
		var _self = this;
		_self.style.display = 'block';
		return _self;
	};

	//隐藏元素(脱离文档流)
	node.Hide = function() {
		/*
			使用方法:
			1.element.Hide();
			5.element.Hide().Html();
		 */
		var _self = this;
		_self.style.display = 'none';
		return _self;
	};

	//显示元素
	node.Visible = function() {
		/*
			使用方法:
			1.element.Visible();
			5.element.Visible().Html();
		 */
		var _self = this;
		_self.style.visibility = 'visible';
		return _self;
	};

	//隐藏元素(未脱离文档流)
	node.Hidden = function() {
		/*
			使用方法:
			1.element.Hidden();
			5.element.Hidden().Html();
		 */
		var _self = this;
		_self.style.visibility = 'hidden';
		return _self;
	};

	//动画
	node.Animation = function(){
		/*
			使用方法:
			1.element.Animation({width:200,height:'200px'});
			2.element.Animation({width:200},{easing:'linear',speed:400});
			3.element.Animation({width:200},{speed:400,fn:function(){
				this.Animation({height:200});
			  }});
			5.element.Animation({width:200}).AddClass(className);
			6.elementA.AddClass(className).Animation(elementB,{width:200});
		 */
	    var _self = this,
	    	_element,
	    	_params,
	    	_options,
	    	_count,
	    	_tempStyles,
	    	_n = 0,
	    	_start = {},
	    	_dis = {},
	    	_bCheck = false,
	    	_timer;

	    if(arguments[0] instanceof HTMLElement){
			_element = arguments[0];
    		_params = arguments[1];
        	_options = arguments[2] || {};
        	_bCheck = true;
	    }
	    else if (Type(arguments[0]) == 'Object'){
    		_element = _self,
    		_params = arguments[0],
        	_options = arguments[1] || {};
        	_bCheck = true;
	    }

	    if(_bCheck){
	    	_options.easing = _options.easing || 'easeOut';
		    _options.speed = _options.speed || 600;
		    _count = parseInt(_options.speed/30);

		    for(var name in _params){
		        _tempStyles = _element.currentStyle?_element.currentStyle[name]:getComputedStyle(_element,false)[name];
		        if(_tempStyles == 'auto' || _tempStyles == '') _tempStyles = 0;
		        _start[name] = parseFloat(_tempStyles);
		        _dis[name] = parseFloat(_params[name]) - _start[name];
		    };

		    clearInterval(_timer);
		    _timer = setInterval(function(){
		        _n++ ;
		        for(var name in _params){
		            switch(_options.easing){
		                case 'linear':
		                    var _a = _n/_count,
		                        _cur = _start[name] + _dis[name] * _a;
		                    break;
		                case 'easeIn':
		                    var _a = _n/_count,
		                        _cur = _start[name] + _dis[name] * Math.pow(_a,3);
		                    break;
		                case 'easeOut':
		                    var _a = 1 - _n/_count,
		                        _cur = _start[name] + _dis[name] * (1-Math.pow(_a,3));
		                    break;
		            }

		            if(name == 'opacity'){
		                _element.style.opacity = _cur;
		                _element.style.filter = 'alpha(opacity:' + _cur * 100 + ')';
		            }else{
		                _element.style[name] = _cur + 'px';
		            }
		        }

		        if(_n == _count){
		            clearInterval(_timer);
		            _options.fn && _options.fn.call(_element);
		        }
		    },30);
	    }
	    
	    return _self;
	};

	//鼠标滚轮方向检测
	node.Scroll = function(callback,deep) {
		/*
			使用方法:
			1.element.Scroll(function(dir,event){
				//code..
				//dir : true -> 滚轮向下滚动;false -> 鼠标向上滚动;
				//event :事件对象
			});

			//第二参数是否屏蔽浏览器默认事件
			2.element.Scroll(function(dir){
				//code..
			},true);

			3.element.Scroll(fnName1).On('click',fnName2)....;
		 */
		var _self = this,
			_fn = callback,
			_deep = deep,
			_bDown;

		//鼠标滚轮检测
		function _fnWheel (e){
			var _event= e || event;

			//鼠标滚轮计算
			_bDown = _event.wheelDelta?_event.wheelDelta<0:_event.detail>0;

			//回调执行
			_fn && _fn.call(_self,_bDown,_event);
			
			//是否屏蔽浏览器默认事件
			_deep && _event.preventDefault && _event.preventDefault();
			return false;
		}
		
		//绑定事件
		if(window.navigator.userAgent.indexOf('Firefox')!=-1){
			_self.Off('DOMMouseScroll');
			_self.On('DOMMouseScroll',_fnWheel,false);
		}else{
			_self.Off('mousewheel');
			_self.On('mousewheel',_fnWheel);
		}

		return _self;
	};

	//碰撞检测
	node.Collision = function(){
		/*
			使用方法:
			1.elementA.Collision(elementB); -> true/false
			2.element.Collision(elements); -> elements[?]
	 	*/
		var _self = this,
			_beHitter = arguments[0],
			_beHitterLeft,
			_beHitterRight,
			_beHitterTop,
			_beHitterBottom,

			//本元素上下左右定位边距
	    	_selfLeft = _self.left(),
	        _selfRight = _self.right(),
	        _selfTop = _self.top(),
	        _selfBottom = _self.bottom(),
	        _collision,
	        _len;

		//单个元素
		if(_beHitter instanceof HTMLElement){
		    //拖放元素上下左右定位边距
		    _beHitterLeft = _beHitter.left();
	        _beHitterRight = _beHitter.right();
	        _beHitterTop = _beHitter.top();
	        _beHitterBottom = _beHitter.bottom();

		    return (_selfRight < _beHitterLeft || _selfBottom < _beHitterTop || _selfLeft > _beHitterRight || _selfTop > _beHitterBottom) ? false : true;
		}
		//一组元素
		else if(_beHitter instanceof NodeList || _beHitter instanceof HTMLCollection){
			_collision = [];
			_len = _beHitter.length;
			for(var i=0;i<_len;i++){
				if(_self == _beHitter[i]) continue;
					_beHitterLeft = _beHitter[i].left();
			        _beHitterRight = _beHitter[i].right();
			        _beHitterTop = _beHitter[i].top();
			        _beHitterBottom = _beHitter[i].bottom();

			    if (_selfRight > _beHitterLeft && _selfBottom > _beHitterTop && _selfLeft < _beHitterRight && _selfTop < _beHitterBottom){
			    	return _beHitter[i];
			    }; 
			}
		}
		else{
			return false;
		}
	};

	//元素顶部距窗口顶部距离
	node.Top = function(){
		return this.getBoundingClientRect().top;
	};

	//元素底部距窗口顶部距离
	node.Bottom = function(){
		return this.getBoundingClientRect().bottom;
	};

	//元素左侧距窗口左侧距离
	node.Left = function(){
		return this.getBoundingClientRect().left;
	};

	//元素右侧距窗口左侧距离
	node.Right = function(){
		return this.getBoundingClientRect().right;
	};

	//DOM对象循环子集
	node.Each = function(fn){
		/*
			使用方法：
			1.element.Each(function(i){
				//i:对象集的索引值
			});
			2.element.Each(function(i,child,self){
				//i:对象子集的索引值
				//child:对象子集中的每个元素
				//self:对象子集本身
			})
		*/
		var _self = this;
		this.children.Each(fn);
		return _self;
	};

	//DOM对象子集选取单独DOM对象
	node.Eq = function(index){
		/*
			使用方法：
			1.element.Eq(1);
			2.element.Eq(0).AddClass(className)....
		*/
		return this.children.Eq(index);
	};

	//获取元素的匹配条件的首个子集元素
	node.First = function(scope){
		/*
			使用方法：
			1.element.First();
			2.element.First('#id')
			3.element.First('.className').AddClass('className')....
		*/
		return this.children.First(scope);
	};

	//获取元素的匹配条件的末尾子集元素
	node.Last = function(scope){
		/*
			使用方法：
			1.element.Last();
			2.element.Last('#id')
			3.element.Last('.className').AddClass('className')....
		*/
		return this.children.Last(scope);
	};

	//获取符合匹配条件的子集
	node.Children = function(scope){
		/*
			使用方法：
			1.element.Children();
			2.element.Children(0);
			3.element.Children('.className');
			4.element.Children(0).AddClass('className')....;
		 */
		var _self = this,
			_children = _self.children,
			_len = _children.length,
			_childrenCont = [],
			_scope = scope;

		if(_scope === undefined) return _children;

		//参数为字符串
		if(Type(_scope) == 'String'){
			_scope._Choose(function(reg){
				for(var i=0,_len=_children.length;i<_len;i++){
					if(reg.test(_children[i].className)){
						_childrenCont.push(_children[i]);
					}
				}
			},function(id){
				for(var i=0,_len=_children.length;i<_len;i++){
					if(id == _children[i].id){
						_childrenCont.push(_children[i]);
						break;
					}
				}
			},function(tag){
				for(var i=0,_len=_children.length;i<_len;i++){
					if(tag == _children[i].tagName){
						_childrenCont.push(_children[i]);
					}
				}
			});
			return _childrenCont._NodeList();//数组转为NodeList类数组
		}

		//参数为数字
		if(Type(_scope) == 'Number'){
			return _children[_scope];
		}
		return _children;
	};

	//查找元素
	node.Find = function(scope){
		var _self = this,
			_scope = scope,
			_ele,
			_eleArr = [];

		if(Type(_scope) != 'String') return _eleArr._NodeList();
		
		_ele = _scope._Choose(function(re,className){
			return _self.getElementsByClassName(className);
		},function(id){
			return document.getElementById(id);
		},function(tag){
			return _self.getElementsByTagName(tag);
		});

		return _ele;
	};
	//检测子集是否有匹配条件的元素并返回true/false
	node.HasChild = function(scope){
		var _self = this,
			_scope = scope,
			_ele;

		if(Type(_scope) == 'Undefined') {
			return _self.children ? true : false;
		}
		if(_scope instanceof HTMLElement){
			return (_scope.parentNode == _self) ? true : false;
		}
		if(Type(_scope) != 'String') return false;

		return _self.Children(_scope).length ? true : false;
	};

/*---------------------------- DOM对象集扩展 ----------------------------*/

	//Dom对象集绑定事件
	collection.On = nodeList.On = function(events,fn,deep){
		/*
			使用方法:
			1.elements.On('click',fnName);
			2.elements.On('click',fnName1).On('mouseover',fnName2).....;
			3.elements.On('click mouseover',fnName);
		 */
		var _self = this,
			_len = _self.length,
			i=0;

		for(;i<_len;i++){
			_self[i].On(events,fn,deep);
		};

		return _self;
	};

	//Dom对象集解绑事件
	collection.Off = nodeList.Off = function(events,fn,deep){
		/*
			使用方法:
			1.elements.Off('click',fnName);
			2.elements.Off('click',fnName1).On('mouseover',fnName2).....;
			3.elements.Off('click mouseover',fnName);
		 */
		var _self = this,
			_len = _self.length;

		for(var i=0;i<_len;i++){
			_self[i].Off(events,fn,deep);
		};

		return _self;
	};

	//DOM对象集移除class
	collection.RemoveClass = nodeList.RemoveClass = function(classNames){
		/*
			使用方法:
			1.elements.RemoveClass('className');
			2.elements.RemoveClass('className1').RemoveClass('className2')....;
		 */
		var _self = this,
			_len = _self.length,
			i=0;

		for(;i<_len;i++){
			_self[i].RemoveClass(classNames);
		}
		return _self;
	};

	//DOM对象集增加class
	collection.AddClass = nodeList.AddClass = function(){
		/*
			使用方法:
			1.elements.AddClass('className');
			2.elements.AddClass('className1,className2,...');
			3.elements.AddClass('className1').AddClass('className2')....;
		 */
		var _self = this,
			_len = _self.length,
			_classNames = arguments,
			_classReg,
			_newClass;
	
		if(_classNames.length <= 0) return _self;//参数为空返回自身

		for(var i=0;i<_classNames.length;i++){//循环参数对象
			_classReg = new RegExp('\\b'+_classNames[i]+'\\b'),
			_newClass = '';

			//如果 参数不是字符串 || 不存在 || 已存在 则跳过本次循环
			if (Type(_classNames[i]) !== 'String' || !_classNames[i] || _classReg.test(_self.className)){
				continue
			}
			//否则插入新className
			else{
				_newClass = _classNames[i].Trim();
				for(var j=0;j<_len;j++){
					//没有class则直接赋值class名
					if(!_self[j].className) {
						_self[j].className = _newClass;
					}
					//有class则加空格加新class名
					else{
						_self[j].className += (' '+ _newClass);
					};
				};
			};
		};
		return _self;
	};

	//插入元素(子元素插入到父级)
	collection.AppendTo = nodeList.AppendTo = function(element){
		/*
			使用方法:
			1.elements.AppendTo(elementParent);
			2.elements.AppendTo(elementParent).on('click',fnName);
		 */
		var _self = this,
			_selfArr = [];

		if(element instanceof HTMLElement){
			if(Type(_self) == 'Array'){
				for(var i=0;i<_self.length;i++){
					_self[i].AppendTo(element);
				}
				return _self;
			}else{
				while(_self.length){
					_selfArr.push(_self[0]);
					_self[0].AppendTo(element);
				}
				return _selfArr._NodeList();
			}
		};
		return _self;
	};

	//克隆元素
	collection.Clone = nodeList.Clone = function(deep){
		/*
			使用方法:
			1.elements.Clone();
			2.elements.Clone(true);
			3.elementChild.Clone(true).AppendTo(elementParent)....;
		 */
		var _self = this,
			_len = _self.length,
			_selfFrag = document.createDocumentFragment();

		for(var i=0;i<_len;i++){
			_selfFrag.appendChild(_self[i].Clone(deep));
		}

		return _selfFrag.children;
	};

	//DOM对象集循环功能
	collection.Each = nodeList.Each = function(fn){/*判断是否有forEach*/
		/*
			使用方法：
			1.elements.Each(function(i){
				//i:对象集的索引值
			});
			2.elements.Each(function(i,ele,child){
				//i:对象集的索引值
				//ele:对象集中的每个元素
				//child:对象集本身
			})
		 */
		
		var _self = this;
		for(var i=0;i<_self.length;i++){
			(function(index){
				fn && fn.call(_self,index,_self[index],_self);
			})(i);
		};
		return _self;
	};

	//DOM对象集选取单独DOM对象功能
	collection.Eq = nodeList.Eq = function(index){
		/*
			使用方法：
			1.elements.Eq(1);
			2.elements.Eq(0).AddClass('className')....
		*/
		var _self = this;
		if(index === undefined || Math.abs(index) >= _self.length) return null;
		if(index>=0) return _self[index];
		if(index<0) return _self[_self.length+index];
	};

	//选择第一个匹配条件的对象
	collection.First = nodeList.First = function(scope){
		/*
			使用方法：
			1.elements.First();
			2.elements.First('#id')
			3.elements.First('.className').AddClass('className')....
		*/
		var _self = this,
			_scope = scope,
			_ele = null;

		if (Type(_scope) == 'String') { //参数为字符串

			_ele = _scope._Choose(function(reg){
				//遍历元素集满足条件则返回
				for (var i = 0; i < _self.length; i++) {
					if (reg.test(_self[i].className)) {
						return _self[i];
					};
				};
			},function(id){
				for (var i = 0; i < _self.length; i++) {
					if (id === _self[i].id) {
						return _self[i];
					};
				};
			},function(tag){
				for (var i = 0; i < _self.length; i++) {
					if (tag === _self[i].tagName) {
						return _self[i];
					}
				};
			});
			
			return (_ele instanceof HTMLElement) ? _ele : null;

		} else {
			return _self[0];
		}
	};

	//选择最后一个匹配条件的对象
	collection.Last = nodeList.Last = function(scope){
		/*
			使用方法：
			1.elements.Last();
			2.elements.Last('#id')
			3.elements.Last('.className').AddClass('className')....
		 */
		var _self = this,
			_scope = scope,
			_ele = null;

		if (Type(_scope) == 'String') { //参数为字符串

			_ele = _scope._Choose(function(reg){
				//遍历元素集满足条件则返回
				for (var i = _self.length-1; i >= 0; i--) {
					if (reg.test(_self[i].className)) {
						return _self[i];
					};
				};
			},function(id){
				for (var i = _self.length-1; i >= 0; i--) {
					if (id === _self[i].id) {
						return _self[i];
					};
				};
			},function(tag){
				for (var i = _self.length-1; i >= 0; i--) {
					if (tag === _self[i].tagName) {
						return _self[i];
					}
				};
			});

			return (_ele instanceof HTMLElement) ? _ele : null;

		} else {
			return _self[_self.length-1];
		}
	};

	//保留包含特定后代的元素，去掉那些不含有指定后代的元素。
	collection.Has = nodeList.Has = function(scope){
		var _self = this,
			_scope = scope,
			_len = _self.length,
			_selfChild,
			_eleAttr = [];

		if(Type(_scope) != 'String') return _eleAttr._NodeList();

		for(var i=0;i<_len;i++){
			_selfChild = _self[i];
			if(_selfChild.HasChild(_scope)){
				_eleAttr.push(_selfChild);
			};
		};
		return _eleAttr._NodeList();
	};

/*---------------------------- 其它扩展 ----------------------------*/

	//字符串去首尾空格/特定字符串
	stringProto.Trim = stringProto.Trim || function(condition){
		/*
			使用方法：'  string  '.Trim() //-> 'string';
		 */
		var _str = condition,
			_strReg;

		if(Type(_str) == 'String'){
			_strReg = new RegExp('^('+_str+')+|('+_str+')+$','g');
			return this.replace(_strReg,'');
		};
		return this.replace(/^\s+|\s+$/g, ''); 
	};

	//判断字符串格式
	stringProto._Choose = stringProto._Choose || function(classFn,idFn,tagFn){
		/*
			工具库内部方法
		 */
		
		var _self = this,
			_classFn = classFn,
			_idFn = idFn,
			_tagFn = tagFn;

		switch (_self.charAt(0)) {
			//class选择器
			case '.':
				var _className = _self.substring(1),
					_classReg = new RegExp('\\b' + _className + '\\b');
				return _classFn && _classFn(_classReg,_className);
				break;

			//id选择器
			case '#':
				var _id = _self.substring(1);
				return _idFn && _idFn(_id);
				break;

			//标签选择器
			default:
				var _tagName = _self.toUpperCase();
				return _tagFn && _tagFn(_tagName);
				break;
		};

		return _self; 
	};

	//将数组转为类数组
	arrayProto._NodeList = arrayProto._NodeList || function(){
		var _self = this;
		_self.__proto__ = collection;
		return _self;
	}

/*---------------------------- 依赖 ----------------------------*/

	//对象类型检测
	function Type(){
		/*
			使用方法：
			1.Type('')   //-> 'String';
			2.Type(0)  //-> 'Number';
			3.Type(div)  //-> 'HTMLDivElement';
			4.Type(undefined) //-> 'Undefined';
			5.Type('',0,{},true) //-> ['String','Number','Object','Boolean']
			6.var type = new Type();
			  type.isFunction(fn) ->true;
			....
		 */
		
		var _typeArr = [],
			_argu = arguments,
			_len = _argu.length;

		//简写检测方法
		if(this != window){
			this['array'] = this['isArray'];
			this['function'] = this['isFunction'];
			this['string'] = this['isString'];
			this['number'] = this['isNumber'];
			this['boolean'] = this['isBoolean'];
		};

		//单参数检测
		if(_len == 1){
			return Object.prototype.toString.call(_argu[0]).slice(8,-1);
		}
		//多参数检测
		else if(_len>1){
			for(var i=0;i<_len;i++){
				_typeArr.push(Object.prototype.toString.call(_argu[i]).slice(8,-1));
			}
			return _typeArr;
		}
	};

	Type.prototype = {
		'check' : function(argument){
			return Object.prototype.toString.call(argument).slice(8,-1);
		},
		'isArray' : function(argument){
			return this.check(argument) == 'Array';
		},
		'isFunction' : function(argument){
			return this.check(argument) == 'Function';
		},
		'isString' : function(argument){
			return this.check(argument) == 'String';
		},
		'isNumber' : function(argument){
			return this.check(argument) == 'Number' && !isNaN(argument);
		},
		'isBoolean' : function(argument){
			return this.check(argument) == 'Boolean';
		}
	};
	Type.prototype.constructor = Type;

	// domReady | 元素选取
	$ = function(argument){
		var _argu = argument,
			_isReady,
			_doReady,
			_lastIndexOf,
			_newArgu,
			_arguReg;

		if(Type(_argu) === 'Function'){
			_isReady = false;
		    _doReady = function() {
		        if (_isReady) return;
		        //确保onready只执行一次 
		        _isReady = true;
		        _argu && _argu.call(window);
		    };
		    //高级浏览器
		    if(document.addEventListener){
		        document.addEventListener('DOMContentLoaded',function(){
		            document.removeEventListener("DOMContentLoaded", arguments.callee, false);
		            _doReady();
		        },false);
		    }
		    //低级浏览器
		    else{
		        (function() {
		            if (_isReady) return;
		            try {
		                document.documentElement.doScroll("left");
		            } catch (error) {
		                setTimeout(arguments.callee, 0);
		                return;
		            }
		            _doReady();
		        })();
		    };
		}
		else if(Type(_argu) === 'String' && document.querySelectorAll){
			_lastIndexOf = _argu.lastIndexOf('#');

			//检测是否存在ID选择器
			if(_lastIndexOf != -1){
				_newArgu = _argu.Trim().substring(_lastIndexOf);
				_arguReg = /[\>\:\s\~\[]+/;

				//检测是否为单纯的ID选择器
				if(_newArgu.search(_arguReg) != -1){
					return document.querySelectorAll(_argu);
				}else{
					return document.getElementById(_newArgu.substring(1));
				}
			}else{
				return document.querySelectorAll(_argu);
			};
		};
	};

	$._json2url = function (json){
	    json.t=Math.random();
	    var arr=[];
	    for(var name in json){
	        arr.push(name+'='+json[name]);
	    }
	    return arr.join('&');
	}
	$.ajax = function (json){
	    var timer=null;
	    json=json || {};
	    if(!json.url){
	        alert('缺少URL');
	        return; 
	    }
	    json.type=json.type || 'get';
	    json.data=json.data || {};
	    json.time=json.time || 3000;
	    json.dataType=json.dataType || 'text';
	    
	    if(window.XMLHttpRequest){
	        var oAjax=new XMLHttpRequest(); 
	    }else{
	        var oAjax=new ActiveXObject('Microsoft.XMLHTTP');
	    }
	    
	    switch(json.type.toLowerCase()){
	        case 'get':
	            oAjax.open('GET',json.url+'?'+$._json2url(json.data),true);
	            oAjax.send();
	            break;
	        case 'post':
	            oAjax.open('POST',json.url,true);
	            oAjax.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
	            oAjax.send(json2url(json.data));
	            break;
	    }
	    
	    //加载状态
	    json.fnLoading && json.fnLoading();
	    
	    oAjax.onreadystatechange=function(){
	        if(oAjax.readyState==4){
	            if(oAjax.status>=200 && oAjax.status<300 || oAjax.status==304){
	                if(json.dataType=='xml'){
	                    json.succ && json.succ(oAjax.responseXML);  
	                }else{
	                    json.succ && json.succ(oAjax.responseText); 
	                }
	            }else{
	                json.error && json.error(oAjax.status);
	            }

	            clearTimeout(timer);
	            
	            //完成状态
	            json.complete && json.complete();   
	        }
	    };
	    
	    //超时
	    timer=setTimeout(function(){
	        alert('网络不给力');
	        oAjax.onreadystatechange=null;
	    },json.time);
	};

	//转为全局变量
	!window['$'] ? $ && (window['$'] = $) : $ && (window['$$'] = $);
	!window['Type'] && 	(window['Type'] = Type);

})(window);