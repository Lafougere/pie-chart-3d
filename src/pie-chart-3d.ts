import { PieChart3d } from './PieChart3d.js'

window.customElements.define('pie-chart-3d', PieChart3d)
declare global {
	interface HTMLElementTagNameMap {
		'pie-chart-3d': PieChart3d
	}
}
