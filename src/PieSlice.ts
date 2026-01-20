import { BufferGeometry, ExtrudeGeometry, Mesh, MeshBasicMaterial, MeshLambertMaterial, Object3D, Path, Shape } from 'three'
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'

const INVISIBLE_MATERIAL = new MeshBasicMaterial({
	color: 0x000000,
	visible: false,
})
const EXTRUDE_SETTINGS_BEVEL = {
	bevelEnabled: true,
	steps: 8,
	bevelSize: 0.05,
	bevelThickness: 0.1,
	bevelSegments: 4,
	bevelOffset: -0.05,
	curveSegments: 32,
}
const EXTRUDE_SETTINGS_NO_BEVEL = {
	bevelEnabled: false,
	curveSegments: 32,
}

export class PieSlice extends Object3D {
	public set innerWidth(value: number) {
		if (this._innerWidth !== value) this.needsUpdate = true
		this._innerWidth = value
	}

	public get innerWidth() {
		return this._innerWidth
	}

	public set outerWidth(value: number) {
		if (this._outerWidth !== value) this.needsUpdate = true
		this._outerWidth = value
	}

	public get outerWidth() {
		return this._outerWidth
	}

	public set sizeInRadians(value: number) {
		if (this._sizeInRadians !== value) this.needsUpdate = true
		this._sizeInRadians = value
	}

	public get sizeInRadians() {
		return this._sizeInRadians
	}

	public set thickness(value: number) {
		if (this._thickness !== value) this.needsUpdate = true
		this._thickness = value
	}

	public get thickness() {
		return this._thickness
	}

	public set labelMargin(value: number) {
		if (this._labelMargin !== value) this.needsUpdate = true
		this._labelMargin = value
	}

	public get labelMargin() {
		return this._labelMargin
	}

	public set needsUpdate(value: boolean) {
		if (this._timeout) clearTimeout(this._timeout)
		this._timeout = setTimeout(() => this.update())
		this._needsUpdate = value
	}

	public get needsUpdate() {
		return this._needsUpdate
	}

	private _sizeInRadians: number = 0

	private _innerWidth: number = 5

	private _outerWidth: number = 8

	private _thickness: number = 0.5

	private _labelMargin = 0.5

	private _needsUpdate = false

	private _timeout: any = null

	public mesh: Mesh

	public invisibleMesh: Mesh = new Mesh(new BufferGeometry(), INVISIBLE_MATERIAL)

	private labelDiv: HTMLDivElement = document.createElement('div')

	public labelSpan: HTMLSpanElement = document.createElement('span')

	private label: CSS2DObject = new CSS2DObject(this.labelDiv)

	private percentDiv = document.createElement('div')

	private percentIndicator = new CSS2DObject(this.percentDiv)

	public material: MeshBasicMaterial | MeshLambertMaterial

	constructor(color: number, materialType: 'basic' | 'lambert' = 'lambert') {
		super()
		this.material = materialType === 'basic' ? new MeshBasicMaterial({ color }) : new MeshLambertMaterial({ color, polygonOffset: true, polygonOffsetFactor: 2 })
		this.mesh = new Mesh(new BufferGeometry(), this.material)
		this.add(this.mesh)
		this.add(this.invisibleMesh)
		this.rotateX(Math.PI * 1.5)
		this.setupLabel(color)
		this.setupPercentIndicator()
	}

	public update() {
		this.updateGeometry()
		this.updateLabels()
	}

	public setLabelText(txt: string) {
		this.labelSpan.innerHTML = txt
	}

	public setPercentText(txt: string) {
		this.percentDiv.innerHTML = txt
	}

	public hideLabel() {
		this.labelSpan.style.display = 'none'
	}

	public showLabel() {
		this.labelSpan.style.display = 'block'
	}

	public hidePercent() {
		this.percentDiv.querySelector('span')!.style.display = 'none'
	}

	public showPercent() {
		this.percentDiv.querySelector('span')!.style.display = 'block'
	}

	private setupLabel(color: number) {
		const { labelDiv, labelSpan, label, mesh } = this
		labelSpan.style.borderBottom = `2px solid #${color.toString(16).padStart(6, '0')}`
		labelDiv.className = 'label'
		labelDiv.appendChild(labelSpan)
		labelDiv.style.backgroundColor = 'transparent'
		label.center.set(0.5, 1)
		label.layers.set(0)
		mesh.add(label)
	}

	private setupPercentIndicator() {
		const { percentDiv, percentIndicator, mesh } = this
		percentDiv.className = 'pct'
		percentDiv.style.backgroundColor = 'transparent'
		percentIndicator.center.set(0, 1)
		percentIndicator.layers.set(0)
		mesh.add(percentIndicator)
	}

	private getArcShape() {
		const { innerWidth, outerWidth, sizeInRadians } = this
		const arc = new Shape()
		arc.moveTo(innerWidth, 0)
		arc.lineTo(outerWidth, 0)
		arc.absarc(0, 0, outerWidth, 0, sizeInRadians, false)
		arc.absarc(0, 0, innerWidth, sizeInRadians, 0, true)
		arc.closePath()
		return arc
	}

	private updateGeometry() {
		const { mesh, invisibleMesh } = this
		const arc = this.getArcShape()
		const newGeometry = new ExtrudeGeometry(arc, {
			...EXTRUDE_SETTINGS_BEVEL,
			depth: this.thickness,
		})
		// hidden geometry without bevel to catch mouse events
		const newHiddenGeometry = new ExtrudeGeometry(arc, {
			...EXTRUDE_SETTINGS_NO_BEVEL,
			depth: this.thickness,
		})
		mesh.geometry.dispose()
		mesh.geometry = newGeometry
		invisibleMesh.geometry.dispose()
		invisibleMesh.geometry = newHiddenGeometry
	}

	private updateLabels() {
		const labelPoint = this.getLabelPoint()
		const pctPoint = this.getPercentPoint()
		this.label.position.set(labelPoint.x, labelPoint.y, this.thickness + 0.2)
		this.percentIndicator.position.set(pctPoint.x, pctPoint.y, this.thickness + 0.2)
	}

	public hideLabels() {
		this.setLabelText('')
		this.setPercentText('')
		this.labelMargin = 0
	}

	public getMovePoint(dist: number): { x: number; y: number } {
		const movePath = new Path()
		movePath.absarc(0, 0, dist, 0, this.sizeInRadians / 2, false)
		return movePath.getPoints(2).pop() as { x: number; y: number }
	}

	private getLabelPoint(): { x: number; y: number } {
		const labelPath = new Path()
		const dist = this.outerWidth + this.labelMargin
		labelPath.absarc(0, 0, dist, 0, this.sizeInRadians / 2, false)
		return labelPath.getPoints(2).pop() as { x: number; y: number }
	}

	private getPercentPoint(): { x: number; y: number } {
		const pctPath = new Path()
		const dist = this.innerWidth === 0 ? this.outerWidth * 0.65 : this.innerWidth + (this.outerWidth - this.innerWidth) / 2
		pctPath.absarc(0, 0, dist, 0, this.sizeInRadians / 2, false)
		return pctPath.getPoints(2).pop() as { x: number; y: number }
	}
}
