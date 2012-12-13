/*!
ARIA Slider Module R1.0
Copyright 2010-2012 Bryan Garaventa (WhatSock.com)
Part of AccDC, a Cross-Browser JavaScript accessibility API, distributed under the terms of the GNU LGPL
	*/

(function(window){

	// $A.fn.debug = true;

	$A.setSlider = function(nubId, config){

		// Save initial object references and vars
		var nub = $A.getEl(nubId), pNode = nub.parentNode, config = config || {};

		// Morph the nub DOM node into an AccDC Obj
		$A.morph(nub,
						{
						id: nubId,
						role: config.role || 'Slider',
						showHiddenBounds: false,
						config:
										{
										min: config.min || 0,
										max: config.max || 100,
										now: config.now || 0,
										// Calculate value to relative pixels
										v2i: function(o, v){
											if (!config.vertical)
												return parseInt(v / this.max * (pNode.clientWidth - o.offsetWidth));

											else
												return parseInt(v / this.max * (pNode.clientHeight - o.offsetHeight));
										},
										// Calculate relative pixels to value
										i2v: function(o, v){
											if (!config.vertical)
												return parseInt(v / (pNode.clientWidth - o.offsetWidth) * this.max);

											else
												return parseInt(v / (pNode.clientHeight - o.offsetHeight) * this.max);
										},
										degradeLbl: document.createTextNode(config.degradeLbl || 'Open Manual Slider')
										},
						update: function(){
							var dc = this;
							dc.css(
											{
											top: (config.vertical) ? pNode.offsetTop + dc.config.v2i(dc.accDCObj, dc.config.now) : '',
											left: (!config.vertical) ? pNode.offsetLeft + dc.config.v2i(dc.accDCObj, dc.config.now) : ''
											});
						},
						isDraggable: true,
						drag:
										{
										confineTo: pNode
										},
						onDrag: function(ev, dd, dc, v, m){
							var v = ( typeof v === 'number' && v >= 0)
								? v : ((!config.vertical) ? dc.config.i2v(dc.accDCObj, dc.accDCObj.offsetLeft - pNode.offsetLeft)
								: dc.config.i2v(dc.accDCObj, dc.accDCObj.offsetTop - pNode.offsetTop));

							if (dc.config.past != v){
								dc.config.now = dc.config.past = v;
								$A.setAttr(dc.accDCObj,
												{
												'aria-valuenow': v,
												'aria-valuetext': (config.valueText && typeof config.valueText === 'function') ? config.valueText(dc, v) : v
												});

								if (dc.config.manual && !m)
									dc.config.sel.value = v.toString();
							}

							if (config.onDrag && typeof config.onDrag === 'function')
								config.onDrag.apply(this,
												[
												ev,
												dd,
												dc,
												v
												]);
						},
						keyDown: function(ev, dc){
							var k = ev.which || ev.keyCode;

							if ((k >= 37 && k <= 40) || (k >= 33 && k <= 36)){
								if ((k == 37 || k == 38) && dc.config.now > dc.config.min)
									dc.config.now--;

								else if ((k == 39 || k == 40) && dc.config.now < dc.config.max)
									dc.config.now++;

								else if (k == 36)
									dc.config.now = dc.config.min;

								else if (k == 35)
									dc.config.now = dc.config.max;

								else if (k == 34)
									dc.config.now = (dc.config.now - dc.config.inc)
										> dc.config.min ? dc.config.now - dc.config.inc : dc.config.min;

								else if (k == 33)
									dc.config.now = (dc.config.now + dc.config.inc)
										< dc.config.max ? dc.config.now + dc.config.inc : dc.config.max;
								setTimeout(function(){
									dc.update.apply(dc);
									dc.onDrag.apply(this,
													[
													ev,
													null,
													dc,
													dc.config.now
													]);
								}, 1);

								ev.preventDefault();
							}
						},
						runDuring: function(dc){
							$A.setAttr(dc.accDCObj,
											{
											tabindex: 0,
											role: 'slider',
											'aria-orientation': config.vertical ? 'vertical' : 'horizontal',
											'aria-label': (config.ariaLabel && typeof config.ariaLabel === 'function') ? config.ariaLabel(dc) : dc.role,
											'aria-valuemin': dc.config.min,
											'aria-valuemax': dc.config.max,
											'aria-valuenow': dc.config.now,
											'aria-valuetext': (config.valueText && typeof config.valueText === 'function')
												? config.valueText(dc, dc.config.now) : dc.config.now
											});
						},
						runAfter: function(dc){
							if (dc.config.now){
								dc.update.apply(dc);
								dc.onDrag.apply(dc.accDCObj,
												[
												null,
												null,
												dc,
												dc.config.now
												]);
							}

							dc.config.inc = parseInt(dc.config.max * 0.1);
							dc.config.degrade = $A.createEl('a',
											{
											href: '#',
											tabindex: '-1'
											}, dc.sraCSS, null, dc.config.degradeLbl);

							pNode.appendChild(dc.config.degrade);
							$A.bind(dc.config.degrade,
											{
											click: function(ev){
												dc.config.span = $A.createEl('span', null,
																{
																position: 'relative',
																zIndex: 1000,
																backgroundColor: '#000',
																color: '#f5f5f5'
																});

												// Generate a string to avoid select.add() backwards - compat issues (see Quirksmode.org)
												var s = '<select title="' + dc.role + '">';

												for (var i = dc.config.min; i <= dc.config.max; i++)
																s += '<option value="' + i + '">'
																	+ ((config.valueText && typeof config.valueText === 'function') ? config.valueText(dc, i) : i)
																	+ '</option>';
												s += '</select>';
												dc.config.span.innerHTML = s;
												pNode.appendChild(dc.config.span);
												dc.config.sel = dc.config.span.firstChild;
												dc.config.sel.value = dc.config.now.toString();
												dc.config.sel.focus();
												dc.config.degrade.parentNode.removeChild(dc.config.degrade);
												dc.config.manual = true;
												$A.bind(dc.config.sel, 'keyup blur', function(ev){
													var v = parseInt(dc.config.sel.value);

													if (v != dc.config.now){
														dc.config.now = v;
														dc.update.apply(dc);
														dc.onDrag.apply(dc.accDCObj,
																		[
																		ev,
																		null,
																		dc,
																		v,
																		true
																		]);
													}
												});

												ev.preventDefault();
											}
											});
							$A.bind(window, 'resize.' + dc.id, function(){
								dc.update.apply(dc);
							});
						},
						cssObj:
										{
										position: 'absolute'
										},
						className: config.className || 'nub'
						});
	};
})(window);