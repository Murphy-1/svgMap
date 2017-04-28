/*!
 * SVG Map
 * @version v1.0.2
 * @author  Rocky(rockyuse@163.com)
 * @date    2014-01-16
 *
 * (c) 2012-2013 Rocky, http://sucaijiayuan.com
 * This is licensed under the GNU LGPL, version 2.1 or later.
 * For details, see: http://creativecommons.org/licenses/LGPL/2.1/
 */

;!function (win, $, undefined) {
	var SVGMap = (function () {
		function SVGMap(dom, options) {  /*dom为设置的DOM元素，options为配置的属性和方法*/
			this.dom = dom;
			this.setOptions(options);
			this.render();
		}
		SVGMap.prototype.options = {
			mapName: 'china', /*名字*/
			mapWidth: 500,  /*地图宽度*/
			mapHeight: 400, /*地图高度*/
			stateColorList: ['2770B5', '429DD4', '5AABDA', '1C8DFF', '70B3DD', 'C6E1F4', 'EDF2F6'],/*自定义颜色数组'shanghai': {'stateInitColor': 3},
中的3就是数组中的第四个颜色	 */
			stateDataAttr: ['stateInitColor', 'stateHoverColor', 'stateSelectedColor', 'baifenbi'],
			stateDataType: 'json',  /*自定义数据格式 json配合stateData，xml配合stateSettingsXmlPath*/
			stateSettingsXmlPath: '', /*xml路径，例'js/res/chinaMapSettings.xml' */
			stateData: {},   /*自定义数据*/

			strokeWidth: 1, /*轮廓线宽度*/
			strokeColor: 'F9FCFE', /*轮廓线颜色*/

			stateInitColor: 'AAD5FF',  /*默认显示颜色*/
			stateHoverColor: 'feb41c', /*鼠标hover颜色*/
			stateSelectedColor: 'E32F02', /*点击显示颜色*/
			stateDisabledColor: 'eeeeee', /*禁用颜色*/
			diabled: false , /*是否禁用*/

			showTip: true,   /*是否显示提示*/
			stateTipWidth: 100,  /*提示宽度*/
			//stateTipHeight: 50, /*提示高度*/
			stateTipX: 0, /*偏移*/
			stateTipY: -10,  /*偏移*/
			stateTipHtml: function (stateData, obj) {   /*返回数据提示function*/
				return obj.name;
			},

			hoverCallback: function (stateData, obj) {},  /*回调hover函数*/
			clickCallback: function (stateData, obj) {},  /*回调click函数*/
			external: false   /*定义外部事件   这里传入一个Object名称，之后基于这个对象设置属性或方法*/
		};

		SVGMap.prototype.setOptions = function (options) {   /*判断是否传入配置信息*/
			if (options == null) { /*为空的话设置参数options为空*/
				options = null;
			}
			this.options = $.extend({}, this.options, options); /*合并对象参数*/
			return this;  /*返回this对象*/
		};

		SVGMap.prototype.scaleRaphael = function (container, width, height) {
			var wrapper = document.getElementById(container);  /*获取DOM对象*/
			if (!wrapper.style.position) wrapper.style.position = "relative"; /*判断是否有定位属性，没有则加上相对定位*/
			wrapper.style.width = width + "px"; /*设置宽*/
			wrapper.style.height = height + "px"; /*设置高*/
			wrapper.style.overflow = "hidden"; /*隐藏此DOM*/
			var nestedWrapper;
			if (Raphael.type == "VML") {
				wrapper.innerHTML = "<rvml:group style='position : absolute; width: 1000px; height: 1000px; top: 0px; left: 0px' coordsize='1000,1000' class='rvml' id='vmlgroup_" + container + "'><\/rvml:group>";
				nestedWrapper = document.getElementById("vmlgroup_" + container);
			} else {
				wrapper.innerHTML = '<div class="svggroup"></div>';
				nestedWrapper = wrapper.getElementsByClassName("svggroup")[0];
			}
			var paper = new Raphael(nestedWrapper, width, height);
			var vmlDiv;
			if (Raphael.type == "SVG") {
				paper.canvas.setAttribute("viewBox", "0 0 " + width + " " + height);
			} else {
				vmlDiv = wrapper.getElementsByTagName("div")[0];
			}
			paper.changeSize = function (w, h, center, clipping) {
				clipping = !clipping;
				var ratioW = w / width;
				var ratioH = h / height;
				var scale = ratioW < ratioH ? ratioW : ratioH;
				var newHeight = parseInt(height * scale);
				var newWidth = parseInt(width * scale);
				if (Raphael.type == "VML") {
					var txt = document.getElementsByTagName("textpath");
					for (var i in txt) {
						var curr = txt[i];
						if (curr.style) {
							if (!curr._fontSize) {
								var mod = curr.style.font.split("px");
								curr._fontSize = parseInt(mod[0]);
								curr._font = mod[1];
							}
							curr.style.font = curr._fontSize * scale + "px" + curr._font;
						}
					}
					var newSize;
					if (newWidth < newHeight) {
						newSize = newWidth * 1000 / width;
					} else {
						newSize = newHeight * 1000 / height;
					}
					newSize = parseInt(newSize);
					nestedWrapper.style.width = newSize + "px";
					nestedWrapper.style.height = newSize + "px";
					if (clipping) {
						nestedWrapper.style.left = parseInt((w - newWidth) / 2) + "px";
						nestedWrapper.style.top = parseInt((h - newHeight) / 2) + "px";
					}
					vmlDiv.style.overflow = "visible";
				}
				if (clipping) {
					newWidth = w;
					newHeight = h;
				}
				wrapper.style.width = newWidth + "px";
				wrapper.style.height = newHeight + "px";
				paper.setSize(newWidth, newHeight);
				if (center) {
					wrapper.style.position = "absolute";
					wrapper.style.left = parseInt((w - newWidth) / 2) + "px";
					wrapper.style.top = parseInt((h - newHeight) / 2) + "px";
				}
			};
			paper.scaleAll = function (amount) {
				paper.changeSize(width * amount, height * amount);
			};
			paper.changeSize(width, height);
			paper.w = width;
			paper.h = height;
			return paper;
		};

		SVGMap.prototype.render = function () {   /*17行执行了此属性函数*/
			var opt = this.options,   /*传入的对象参数赋值给opt*/
				_self = this.dom,  /*配置的DOM节点赋值给——self内部变量*/
				mapName = opt.mapName,   /*配置名称赋值给mapName变量*/
				mapConfig = eval(mapName + 'MapConfig');   /*返回对应的chinaMapConfig或者wordMapConfig对象*/
			var stateData = {};

			if (opt.stateDataType == 'xml') {   /*判断自定义数据格式是xml还是json*/
				var mapSettings = opt.stateSettingsXmlPath;  /*自定义xml文件路径*/
				$.ajax({  /*ajax请求xml*/
					type: 'GET',
					url: mapSettings,
					async: false,
					dataType: $.browser.msie ? 'text' : 'xml',
					success: function (data) {
						var xml;
						if ($.browser.msie) {
							xml = new ActiveXObject('Microsoft.XMLDOM');
							xml.async = false;
							xml.loadXML(data);
						} else {
							xml = data;
						}
						var $xml = $(xml);
						$xml.find('stateData').each(function (i) {
							var $node = $(this),
								stateName = $node.attr('stateName');

							stateData[stateName] = {};
							// var attrs = $node[0].attributes;
							// alert(attrs);
							// for(var i in attrs){
							//     stateData[stateName][attrs[i].name] = attrs[i].value;
							// }
							for (var i = 0, len = opt.stateDataAttr.length; i < len; i++) {
								stateData[stateName][opt.stateDataAttr[i]] = $node.attr(opt.stateDataAttr[i]);
							}
						});
					}
				});
			} else {
				stateData = opt.stateData;   /*自定义数据json付给stateData变量*/
			};

			var offsetXY = function (e) {
					var mouseX, mouseY, tipWidth = $('.stateTip').outerWidth(),
						tipHeight = $('.stateTip').outerHeight();
					if (e && e.pageX) {
						mouseX = e.pageX;
						mouseY = e.pageY;
					} else {
						mouseX = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
						mouseY = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
					}
					mouseX = mouseX - tipWidth / 2 + opt.stateTipX < 0 ? 0 : mouseX - tipWidth / 2 + opt.stateTipX;
					mouseY = mouseY - tipHeight + opt.stateTipY < 0 ? mouseY - opt.stateTipY : mouseY - tipHeight + opt.stateTipY;
					return [mouseX, mouseY];
				};

			var current, reTimer;

			var r = this.scaleRaphael(_self.attr('id'), mapConfig.width, mapConfig.height),/*DOM的id，对应地图Config的宽高*/
				attributes = {
					fill: '#' + opt.stateInitColor,
					cursor: 'pointer',
					stroke: '#' + opt.strokeColor,
					'stroke-width': opt.strokeWidth,
					'stroke-linejoin': 'round'
				};

			var stateColor = {};

			for (var state in mapConfig.shapes) {
				var thisStateData = stateData[state],
					initColor = '#' + (thisStateData && opt.stateColorList[thisStateData.stateInitColor] || opt.stateInitColor),
					hoverColor = '#' + (thisStateData && thisStateData.stateHoverColor || opt.stateHoverColor),
					selectedColor = '#' + (thisStateData && thisStateData.stateSelectedColor || opt.stateSelectedColor),
					disabledColor = '#' + (thisStateData && thisStateData.stateDisabledColor || opt.stateDisabledColor);

				stateColor[state] = {};

				stateColor[state].initColor = initColor;
				stateColor[state].hoverColor = hoverColor;
				stateColor[state].selectedColor = selectedColor;

				var obj = r.path(mapConfig['shapes'][state]);

				obj.id = state;
				obj.name = mapConfig['names'][state];
				obj.attr(attributes);

				if (opt.external) {
					opt.external[obj.id] = obj;
				}

				if (stateData[state] && stateData[state].diabled) {
					obj.attr({
						fill: disabledColor,
						cursor: 'default'
					});
				} else {
					obj.attr({
						fill: initColor
					});

					obj.hover(function (e) {
						if (this != current) {   /*不是选中元素则按默认hover颜色设置*/
							this.animate({
								fill: stateColor[this.id].hoverColor
							}, 250);
						}
						if (opt.showTip) {
							clearTimeout(reTimer);
							if ($('.stateTip').length == 0) {

								$(document.body).append('<div class="stateTip"></div>');
							}
							$('.stateTip').html(opt.stateTipHtml(stateData, this));
							var _offsetXY = new offsetXY(e);
							$('.stateTip').css({
								width: opt.stateTipWidth || 'auto',
								height: opt.stateTipHeight || 'auto',
								left: _offsetXY[0],
								top: _offsetXY[1]
							}).show();
						}

						opt.hoverCallback(stateData, this);
					});

					obj.mouseout(function () {
						if (this != current) {
							this.animate({
								fill: stateColor[this.id].initColor
							}, 250);
						}
						// $('.stateTip').hide();
						if (opt.showTip) {    /*离开DOM时删除tip提示*/
							reTimer = setTimeout(function () {
								$('.stateTip').remove(); /*只有离开DOM元素才会删除*/
							}, 100);
						}
					});

					obj.mouseup(function (e) {
						if (current) {   /*判断点击对象之前是否点击过其他对象有的话清除之前对象的样式*/
							current.animate({
								fill: stateColor[current.id].initColor
							}, 250);
						}

						this.animate({   /*设置点击对象的颜色*/
							fill: stateColor[this.id].selectedColor
						}, 250);

						current = this;
						opt.clickCallback(stateData, this);
					});
				}
				r.changeSize(opt.mapWidth, opt.mapHeight, false, false);
			}
			/* document.body.onmousemove = function (e) {
				var _offsetXY = new offsetXY(e);
				$('.stateTip').css({
					left: _offsetXY[0],
					top: _offsetXY[1]
				});
			};*/
			$(_self).on("mousemove",function (e) {
				var _offsetXY = new offsetXY(e);
				$('.stateTip').css({
					left: _offsetXY[0],
					top: _offsetXY[1]
				});
			});
		};
		return SVGMap;
	})();

	$.fn.SVGMap = function (opts) {          /*函数入口*/
		var $this = $(this),
			data = $this.data();

		if (data.SVGMap) {
			delete data.SVGMap;
		}
		if (opts !== false) {
			data.SVGMap = new SVGMap($this, opts);
		}
		return data.SVGMap;
	};
}(window, jQuery);
