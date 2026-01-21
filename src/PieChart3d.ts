/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */
import { html, css, LitElement, type PropertyValues } from 'lit'
import { property, state } from 'lit/decorators.js'
import { AmbientLight, Color, DirectionalLight, NeutralToneMapping, Object3D, PerspectiveCamera, Raycaster, Scene, Vector2, WebGLRenderer } from 'three'

import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js'
import { Tween, Easing } from '@tweenjs/tween.js'
import { PieSlice } from './PieSlice'

const COLORS = {
	red: 0xf44336,
	blue: 0x2196f3,
	orange: 0xff9800,
	green: 0x4caf50,
	yellow: 0xffeb3b,
	pink: 0xe91e63,
	lightblue: 0x03a9f4,
	purple: 0x9c27b0,
	amber: 0xffc107,
	lightgreen: 0x8bc34a,
	indigo: 0x7986cb,
	cyan: 0x00bcd4,
	teal: 0x009688,
	brown: 0x8d6e63,
	bluegrey: 0x607d8b,
	deeppurple: 0x673ab7,
}
const TWO_PI = Math.PI * 2
const MAX_ROTATION = -TWO_PI
const EASE_INOUT = Easing.Exponential.InOut
const EASE_OUT = Easing.Exponential.InOut

function boxesIntersect(r1: DOMRect, r2: DOMRect) {
	return !(r2.left > r1.right || r2.right < r1.left || r2.top > r1.bottom || r2.bottom < r1.top)
}

export interface ChartProps {
	slices: { [key: string]: number }
	width: number
	height: number

	colors?: number[] // an array of colors for the slices
	innerWidth?: number
	outerWidth?: number
	animationDuration?: number
	material?: 'lambert' | 'basic'
	thickness?: number
	lightIntensity?: number
	hideLabels?: boolean
	hidePercents?: boolean
}

export class PieChart3d extends LitElement {
	static styles = css`
		:host {
			display: inline-block;
			position: relative;
			color: currentColor;
			width: 100%;
			height: 100%;
		}
		#main {
			width: 100%;
			height: 100%;
		}
		.label,
		.pct {
			pointer-events: none;
		}
		.pct span {
			position: absolute;
			left: 0;
			transform: translate(-50%, -50%);
			text-align: center;
			font-size: var(--pie-3d-pct-font-size, 0.8em);
			color: #eee;
			text-shadow: 1px 1px 0px #111;
			line-height: 1.1;
		}
		.label span {
			position: absolute;
			left: 0;
			transform: translate(-50%, -50%);
			text-align: center;
			border-bottom: 2px solid transparent;
			display: none;
			line-height: 1.1;
		}
	`

	@property({ type: Object }) public slices: any = {}

	@property({ type: Array }) public colors: number[] = Object.values(COLORS)

	@property({ type: Number }) public innerWidth = 4

	@property({ type: Number }) public outerWidth = 8

	@property({ type: Number }) public labelMargin = 1.5

	@property({ type: Number }) public thickness = 0.5

	@property({ type: Number }) public highlightDistance = 1.0

	@property({ type: Number }) public outlineColor = 0xffffff

	@property({ type: Number }) public width = 0

	@property({ type: Number }) public height = 0

	@property({ type: Number }) public lightIntensity = 1.0

	@property({ type: Number }) public ambientLightIntensity = 0.4

	@property({ type: Number }) public toneMappingExposure = 1.5

	@property({ type: Number }) public animationDuration = 1500

	@property({ type: Boolean }) public hideLabels = false

	@property({ type: Boolean }) public hidePercents = false

	@property({ type: String }) public material: 'lambert' | 'basic' = 'lambert'

	private renderer = new WebGLRenderer({ alpha: true, antialias: false })

	private scene = new Scene()

	private camera = new PerspectiveCamera(30, this.width / this.height, 1, 100)

	private sliceContainer = new Object3D()

	private pointer = new Vector2(1000, 1000)

	private raycaster = new Raycaster()

	private intersected: any = null

	private invisibleSlices: any[] = []

	private labelRenderer = new CSS2DRenderer()

	private composer = new EffectComposer(this.renderer)

	private outlinePass = new OutlinePass(new Vector2(this.width, this.height), this.scene, this.camera)

	private shaderPass = new ShaderPass(FXAAShader)

	public light = new DirectionalLight(0xffffff, this.lightIntensity)

	private resizeObserver = new ResizeObserver(this.onResize.bind(this))

	private initialAnimation = true

	@state() private actualWidth = 0

	@state() private actualHeight = 0

	private resizeTween = new Tween(this).easing(EASE_INOUT)

	private lightTween = new Tween(this.light).easing(EASE_INOUT)

	firstUpdated(): void {
		const { renderer, labelRenderer, composer, camera, outlinePass, scene, sliceContainer, outlineColor, light } = this
		const { devicePixelRatio } = window
		const container = this.shadowRoot!.querySelector('#main') as HTMLDivElement

		container.appendChild(renderer.domElement)
		container.appendChild(labelRenderer.domElement)
		container.addEventListener('mousemove', this.onPointerMove.bind(this))
		container.addEventListener('click', this.onPointerClick.bind(this))

		light.position.set(-10, 10, 10)

		renderer.toneMapping = NeutralToneMapping
		renderer.toneMappingExposure = this.toneMappingExposure
		renderer.setPixelRatio(devicePixelRatio)
		renderer.setAnimationLoop(this._animate.bind(this))

		labelRenderer.domElement.style.position = 'absolute'
		labelRenderer.domElement.style.top = '0px'

		camera.position.set(0, 20, 27)
		camera.lookAt(0, 0, 0)

		outlinePass.edgeStrength = 4.0
		outlinePass.edgeGlow = 0.0
		outlinePass.edgeThickness = 2.5
		outlinePass.visibleEdgeColor.set(outlineColor)
		outlinePass.hiddenEdgeColor.set(outlineColor)

		composer.setPixelRatio(devicePixelRatio)
		composer.addPass(new RenderPass(scene, camera))
		composer.addPass(outlinePass)
		composer.addPass(new OutputPass())
		composer.addPass(this.shaderPass)

		sliceContainer.rotateY(Math.PI * 0.5)

		scene.add(sliceContainer)
		scene.add(new AmbientLight(0xffffff, this.ambientLightIntensity))
		scene.add(light)
		this.resizeObserver.observe(this)
	}

	private onResize() {
		let { width, height } = this
		if (!width || !height) {
			const rect = this.getBoundingClientRect()
			if (!width) width = rect.width
			if (!height) height = rect.height
		}
		width = Math.max(240, width)
		height = Math.max(180, height)
		this.actualWidth = width
		this.actualHeight = height
	}

	private updateSize() {
		const { renderer, labelRenderer, composer, camera, shaderPass, outlinePass, actualWidth, actualHeight } = this
		const { devicePixelRatio } = window
		camera.aspect = actualWidth / actualHeight
		camera.updateProjectionMatrix()
		renderer.setSize(actualWidth, actualHeight)
		labelRenderer.setSize(actualWidth, actualHeight)
		composer.setSize(actualWidth, actualHeight)
		outlinePass.setSize(actualWidth, actualHeight)
		shaderPass.uniforms.resolution.value.set((1 / actualWidth) * devicePixelRatio, (1 / actualHeight) * devicePixelRatio)
		this.renderScene()
	}

	private setupSlices() {
		const { sliceContainer, slices, labelMargin, colors, invisibleSlices, animationDuration } = this
		const { innerWidth, outerWidth, thickness } = this
		const existingSlices = sliceContainer.children as PieSlice[]
		const sliceCount = Object.keys(slices).length
		const { selectedObjects } = this.outlinePass
		if (sliceCount < existingSlices.length) {
			// remove slices, ie: set their size to 0 and their rotation to max
			for (let i = sliceCount; i < existingSlices.length; i++) {
				const slice = sliceContainer.children[i] as PieSlice
				slice.hideLabels()
				slice.userData.animtween = new Tween(slice).to({ sizeInRadians: 0, innerWidth, outerWidth, thickness }, animationDuration).easing(EASE_INOUT).start()
				slice.userData.rotatetween = new Tween(slice.rotation).to({ z: MAX_ROTATION }, animationDuration).easing(EASE_INOUT).start()
				const idx = selectedObjects.indexOf(slice)
				if (idx !== -1) {
					// deselect slice if selected
					this.resetSlice(slice)
					selectedObjects.splice(idx, 1)
				}
			}
		}
		let current = 0
		Object.keys(slices).forEach((key, index) => {
			if (!sliceContainer.children[index]) {
				const pieSlice = new PieSlice(colors[index], this.material)
				sliceContainer.add(pieSlice)
				invisibleSlices.push(pieSlice.invisibleMesh)
				// slices that are not created during the initial animation should be moved to MAX_ROTATION
				// to appear from the end of the pie and of the same shape as the existing slices
				if (!this.initialAnimation) {
					const { innerWidth, outerWidth, thickness } = this.sliceContainer.children[0] as PieSlice
					Object.assign(pieSlice, { sizeInRadians: 0, innerWidth, outerWidth, thickness })
					pieSlice.rotation.z = MAX_ROTATION
				} else {
					// on first run, set innerWidth, outerWidth and thickness without transitions
					const { innerWidth, outerWidth, thickness } = this
					Object.assign(pieSlice, { sizeInRadians: 0, innerWidth, outerWidth, thickness })
				}
			}
			const values: number[] = Object.values(slices)
			const total = values.reduce((prev, current) => prev + current, 0)
			const sizeInRadians = (slices[key] / total) * TWO_PI
			const pct = (sizeInRadians / TWO_PI) * 100
			const slice = sliceContainer.children[index] as PieSlice
			const z = -(sizeInRadians + current)
			slice.userData.animtween = new Tween(slice).to({ sizeInRadians, innerWidth, outerWidth, thickness }, animationDuration).easing(EASE_INOUT).start()
			slice.userData.rotatetween = new Tween(slice.rotation).to({ z }, animationDuration).easing(EASE_INOUT).start()
			slice.labelMargin = 0
			slice.percentMargin = 0
			slice.setLabelText(key)
			slice.setPercentText(`${pct.toFixed(1)}%`)
			slice.hideLabel()
			slice.hidePercent()
			this.labelRenderer.render(this.scene, this.camera)
			setTimeout(() => {
				if (!this.hideLabels) slice.showLabel()
				if (!this.hidePercents) slice.showPercent()

				slice.userData.labeltween = new Tween(slice)
					.to({ labelMargin }, this.animationDuration / 5)
					.easing(EASE_OUT)
					.start()

				this.initialAnimation = false
			}, animationDuration)
			current += sizeInRadians
		})
		setTimeout(
			() => {
				this.cnt = 0
				this.fixOverlaps('labelSpan')
				this.fixOverlaps('percentSpan')
			},
			this.animationDuration + this.animationDuration / 5,
		)
	}
	private cnt = 0
	private fixOverlaps(span: 'labelSpan' | 'percentSpan' = 'labelSpan') {
		// we attempt to mitigate label overlaps by increasing the labelMargin when
		// a label overlaps with the previous label
		const children = this.sliceContainer.children as PieSlice[]
		let hasOverlap = false
		children.forEach((child, idx) => {
			if (idx === 0) return
			const currentBox = child[span].getBoundingClientRect()
			const prevBox = children[idx - 1][span].getBoundingClientRect()
			if (boxesIntersect(currentBox, prevBox)) {
				hasOverlap = true
				if (span === 'labelSpan') child.labelMargin += 0.07
				else child.percentMargin += 0.03
			}
		})
		if (hasOverlap && this.cnt < 300) {
			this.cnt++
			this.labelRenderer.render(this.scene, this.camera)
			setTimeout(() => this.fixOverlaps(span), 5)
		}
	}

	protected updated(_changedProperties: PropertyValues): void {
		if (_changedProperties.has('slices') || _changedProperties.has('outerWidth') || _changedProperties.has('innerWidth') || _changedProperties.has('thickness')) {
			this.setupSlices()
		}
		if (_changedProperties.has('colors')) {
			this.updateColors()
		}
		if (_changedProperties.has('lightIntensity')) {
			this.lightTween.to({ intensity: this.lightIntensity }, this.animationDuration).start()
		}
		if (_changedProperties.has('labelMargin')) {
			const slices = this.sliceContainer.children as PieSlice[]
			slices.forEach((slice) => {
				slice.userData.labeltween = new Tween(slice).to({ labelMargin: this.labelMargin }).easing(EASE_INOUT).start()
			})
		}
		if (_changedProperties.has('hideLabels') && !this.initialAnimation) {
			const slices = this.sliceContainer.children as PieSlice[]
			if (this.hideLabels) {
				slices.forEach((slice) => slice.hideLabel())
			} else {
				slices.forEach((slice) => slice.showLabel())
			}
		}
		if (_changedProperties.has('hidePercents') && !this.initialAnimation) {
			const slices = this.sliceContainer.children as PieSlice[]
			if (this.hidePercents) {
				slices.forEach((slice) => slice.hidePercent())
			} else {
				slices.forEach((slice) => slice.showPercent())
			}
		}
		if (_changedProperties.has('width') || _changedProperties.has('height')) {
			if (!this.width || !this.height) return
			if (this.initialAnimation) {
				setTimeout(() => {
					this.actualHeight = this.height
					this.actualWidth = this.width
				})
			} else {
				this.resizeTween.to({ actualWidth: this.width, actualHeight: this.height }, this.animationDuration).start()
			}
		}
		if (_changedProperties.has('actualWidth') || _changedProperties.has('actualHeight')) {
			this.updateSize()
		}
	}

	private updateColors() {
		const { animationDuration } = this
		this.colors.forEach((color, index) => {
			if (index >= this.sliceContainer.children.length) return
			const slice = this.sliceContainer.children[index] as PieSlice
			const tmpColor = new Color(color)

			const { r, g, b } = tmpColor
			slice.userData.colortween = new Tween(slice.material.color)
				.to({ r, g, b }, animationDuration)
				.onUpdate(() => {
					const { r, g, b } = slice.material.color
					slice.labelSpan.style.borderBottomColor = `rgba(${r * 255},${g * 255},${b * 255})`
				})
				.easing(EASE_INOUT)
				.start()
		})
	}

	private onPointerMove(event: MouseEvent) {
		if (event.offsetX === 0 && event.offsetY === 0) return
		this.pointer.x = (event.offsetX / this.actualWidth) * 2 - 1
		this.pointer.y = -(event.offsetY / this.actualHeight) * 2 + 1
	}

	private onPointerClick() {
		const { intersected, sliceContainer } = this
		const { selectedObjects } = this.outlinePass
		if (intersected) {
			const idx = selectedObjects.indexOf(intersected)
			if (idx !== -1) {
				selectedObjects.splice(idx, 1)
			} else {
				const index = sliceContainer.children.indexOf(intersected)
				this.dispatchEvent(new CustomEvent('slice-selected', { detail: { index } }))
				selectedObjects.push(intersected)
			}
			const selectedSlices = selectedObjects.map((obj: any) => sliceContainer.children.indexOf(obj))
			this.dispatchEvent(new CustomEvent('selection-changed', { detail: { selectedSlices } }))
		}
	}

	private moveSliceOut(slice: PieSlice) {
		const { x, y } = slice.getMovePoint(this.highlightDistance)
		const z = this.thickness + 0.2
		slice.userData.tween = new Tween(slice.children[0].position).to({ x, y, z }, 700).easing(EASE_OUT).start()
	}

	private resetSlice(slice: PieSlice) {
		slice.userData.tween = new Tween(slice.children[0].position).to({ x: 0, y: 0, z: 0 }, 100).start()
	}

	private renderScene() {
		if (!this.actualWidth || !this.actualHeight) return
		const { raycaster, intersected, pointer, camera, invisibleSlices, scene } = this
		const { selectedObjects } = this.outlinePass
		raycaster.setFromCamera(pointer, camera)
		const intersects = raycaster.intersectObjects(invisibleSlices, false)
		if (intersects.length > 0) {
			const idx = invisibleSlices.indexOf(intersects[0].object)
			const obj: any = this.sliceContainer.children[idx]
			if (intersected !== obj) {
				if (intersected && !selectedObjects.includes(intersected)) {
					this.resetSlice(intersected)
				}
				this.intersected = obj
				this.moveSliceOut(this.intersected)
			}
		} else {
			if (intersected && !selectedObjects.includes(intersected)) {
				this.resetSlice(intersected)
			}
			this.intersected = null
		}
		this.composer.render()
		this.labelRenderer.render(scene, camera)
	}

	private _animate(time: number) {
		this.sliceContainer.children.forEach((child: any) => {
			child.userData.tween?.update(time)
			child.userData.animtween?.update(time)
			child.userData.rotatetween?.update(time)
			child.userData.labeltween?.update(time)
			child.userData.colortween?.update(time)
		})
		this.resizeTween.update(time)
		this.lightTween.update(time)
		this.renderScene()
	}

	render() {
		return html`<div id="main" style="width: ${this.actualWidth}px; height: ${this.actualHeight}px;"></div>`
	}
}
