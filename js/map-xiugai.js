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
		function SVGMap(dom, options) {
			this.dom = dom;
			this.setOptions(options);
			this.render();
		}
		SVGMap.prototype.options = {
			mapName: 'china', /*名字*/
			mapWidth: 500,  /*地图宽度*/
			mapHeight: 400, /*地图高度*/
			stateColorList: ['2770B5', '429DD4', '5AABDA', '1C8DFF', '70B3DD', 'C6E1F4', 'EDF2F6'],
			stateDataAttr: ['stateInitColor', 'stateHoverColor', 'stateSelectedColor', 'baifenbi'],
			stateDataType: 'json',  /*自定义数据格式 json配合stateData，xml配合stateSettingsXmlPath*/
			stateSettingsXmlPath: '', /*xml路径，例'js/res/chinaMapSettings.xml' */
			stateData: {},   /*自定义数据*/

			strokeWidth: 1,
			strokeColor: 'F9FCFE',

			stateInitColor: 'AAD5FF',
			stateHoverColor: 'feb41c',
			stateSelectedColor: 'E32F02',
			stateDisabledColor: 'eeeeee',

			showTip: true,   /*是否显示提示*/
			stateTipWidth: 100,
			//stateTipHeight: 50,
			stateTipX: 0,
			stateTipY: -10,
			stateTipHtml: function (stateData, obj) {   /*返回数据function*/
				return obj.name;
			},

			hoverCallback: function (stateData, obj) {},  /*回调函数*/
			clickCallback: function (stateData, obj) {},
			external: false   /*定义外部事件   这里传入一个Object名称，之后基于这个对象设置属性或方法*/
		};

		SVGMap.prototype.setOptions = function (options) {
			if (options == null) {
				options = null;
			}
			this.options = $.extend({}, this.options, options);
			return this;
		};

		SVGMap.prototype.scaleRaphael = function (container, width, height) {
			var wrapper = document.getElementById(container);
			if (!wrapper.style.position) wrapper.style.position = "relative";
			wrapper.style.width = width + "px";
			wrapper.style.height = height + "px";
			wrapper.style.overflow = "hidden";
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

		SVGMap.prototype.render = function () {
			var opt = this.options,
				_self = this.dom,
				mapName = opt.mapName,
				mapConfig = eval(mapName + 'MapConfig');

			var stateData = {};

			if (opt.stateDataType == 'xml') {
				var mapSettings = opt.stateSettingsXmlPath;
				$.ajax({
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
				stateData = opt.stateData;
			}

			var offsetXY = function (obj) {
				var mouseX = $(obj.node).offset().left+$(obj.node).outerWidth()/2, mouseY = $(obj.node).offset().top+$(obj.node).outerHeight()/2-65;
				console.log($(obj.node).outerWidth()/2);
				var paperTip = Raphael('stateTip',330, 110);
				paperTip.path('M0,65L50,0L50,110Z').attr({
					fill : '#e9e9e9',
					opacity : 0.4,
					stroke : '#e9e9e9'
				});
				paperTip.path('M0,65L50,0L330,0Z').attr({
					fill : '#aaaaaa',
					opacity : 0.4,
					stroke : '#aaaaaa'
				});
				paperTip.path('M0,65L330,0L330,110Z').attr({
					fill : '#c9c8c8',
					opacity : 0.4,
					stroke : '#c9c8c8'
				});
				paperTip.path('M0,65L330,110L50,110Z').attr({
					fill : '#d7d6d6',
					opacity : 0.4,
					stroke : '#d7d6d6'
				});

				paperTip.rect(50,0,280,110).attr({
					fill : '#ffffff',
					stroke : '#ffffff'
				});
				return [mouseX,mouseY];
			};

			var r = this.scaleRaphael(_self.attr('id'), mapConfig.width, mapConfig.height),
				attributes = {
					fill: '#' + opt.stateInitColor,
					cursor: 'pointer',
					stroke: '#' + opt.strokeColor,
					'stroke-width': opt.strokeWidth,
					'stroke-linejoin': 'round'
				};

			var stateColor = {},objHover;

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
				obj.name = mapConfig['names'][state]['name'];
				obj.attr(attributes);
				var offsetX =obj.getBBox().x+mapConfig['names'][state]['x'], offsetY =obj.getBBox().y+mapConfig['names'][state]['y'];
				var font = r.text(offsetX,offsetY,obj.name).attr({cursor: 'pointer','metadata' : {mapId: 1 }});
				obj.font = font;
				font.obj = obj;

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
					objHover =obj;
					obj.mousemove(function(){
						objHover.attr({
							fill: stateColor[objHover.id].initColor
						});
						objHover = this;
						this.attr({
							fill: stateColor[this.id].hoverColor
						});
						if (opt.showTip) {
							$('#stateTip').empty();
							var _offsetXY = new offsetXY(this.font);
							$('#stateTip').css({
								height: '110px'
							}).stop(false,true).animate({
								left:_offsetXY[0],
								top: _offsetXY[1],
								display : 'inline'
							},100).show();
						}
					});
					font.mousemove(function(){
						objHover.attr({
							fill: stateColor[objHover.id].initColor
						});
						objHover = this.obj;
						this.obj.attr({
							fill: stateColor[this.obj.id].hoverColor
						});
						if (opt.showTip) {
							$('#stateTip').empty();
							var _offsetXY = new offsetXY(this);
							$('#stateTip').css({
								height: '110px'
							}).stop(false,true).animate({
								left:_offsetXY[0],
								top: _offsetXY[1],
								display : 'inline'
							},100).show();
						}
					});
				}
				r.changeSize(opt.mapWidth, opt.mapHeight, false, false);
			}
			$("body").mousemove(function(e){
				var _svg = _self;
				if(e.pageX<_svg.offset().left|| e.pageX>(_svg.offset().left+_svg.innerWidth())||
					e.pageY<_svg.offset().top|| e.pageY>(_svg.offset().top+_svg.innerHeight())){
					objHover.attr({
						fill: initColor
					});
					$('#stateTip').hide();
				}
			});
		}
		return SVGMap;
	})();

	$.fn.SVGMap = function (opts) {
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
