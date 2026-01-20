import { PieChart3d } from './PieChart3d.js'
declare global {
	interface HTMLElementTagNameMap {
		'pie-3d': PieChart3d
	}
}
window.customElements.define('pie-3d', PieChart3d)
