import type { Meta, StoryObj } from '@storybook/web-components-vite'
import { html, css, LitElement, type PropertyValues } from 'lit'
import { fn } from 'storybook/test'

// import type { ChartProps } from '../PieChart3d'
// import { PieChart3d } from '../PieChart3d'
import '../pie-3d'
import './pie-3d.css'

export interface ChartProps {
	dataset: string
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
	labelMargin?: number
}

const slices = {
	Belgium: 25,
	UK: 5,
	Germany: 3,
	France: 35,
	Luxemburg: 10,
}
const slices2 = {
	Belgium: 25,
	UK: 5,
	Germany: 3,
	France: 35,
	Luxemburg: 10,
	'The Netherlands': 30,
	Hungary: 7,
	Denmark: 1,
	Italy: 12,
	Spain: 15,
	Portugal: 8,
}
const slices3 = {
	Belgium: 56,
	UK: 5,
	Germany: 13,
	France: 22,
	Luxemburg: 14,
	'The Netherlands': 32,
	Hungary: 9,
	Denmark: 1,
	Italy: 14,
	Spain: 15,
	Portugal: 41,
	Switzerland: 11,
	Austria: 32,
	Sweden: 11,
	Norway: 14,
	Finland: 3,
}
const datasets: any = {
	small: slices,
	medium: slices2,
	large: slices3,
}
// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
const meta = {
	title: 'Pie Chart 3D',
	tags: ['autodocs'],
	render: (args, { parameters, context }) => {
		console.log(parameters, args, context)
		console.log()
		return html` <div class="${context.globals.backgrounds.value}">
			<pie-3d
				.slices="${datasets[args.dataset]}"
				innerWidth="${args.innerWidth as number}"
				outerWidth="${args.outerWidth as number}"
				thickness="${args.thickness as number}"
				lightIntensity="${args.lightIntensity as number}"
				material="${args.material as 'lambert' | 'basic'}"
				width="800"
				height="600"
				animationDuration="${args.animationDuration as number}"
				?hideLabels="${args.hideLabels}"
				?hidePercents="${args.hidePercents}"
			>
			</pie-3d>
		</div>`
	},
	argTypes: {
		dataset: { control: 'select', options: ['small', 'medium', 'large'] },
		innerWidth: { control: { type: 'range', min: 0, max: 10 }, table: { defaultValue: { summary: '4' } } },
		outerWidth: { control: { type: 'range', min: 0, max: 10 }, table: { defaultValue: { summary: '8' } } },
		thickness: { control: { type: 'range', min: 0, max: 5, step: 0.1 }, table: { defaultValue: { summary: '0.5' } } },
		lightIntensity: { control: { type: 'range', min: 0, max: 5, step: 0.1 }, description: 'Intensity of the directional light', table: { defaultValue: { summary: '1.5' } } },
		animationDuration: { control: { type: 'range', min: 0, max: 5000, step: 500 }, table: { defaultValue: { summary: '1500' } } },
		material: { control: 'radio', options: ['lambert', 'basic'], table: { defaultValue: { summary: 'lambert' } } },
		hideLabels: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
		hidePercents: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
		labelMargin: { control: { type: 'range', min: 0, max: 4, step: 0.5 }, table: { defaultValue: { summary: '1.5' } } },
		// colors: { control: 'color' },
		// size: {
		//   control: { type: 'select' },
		//   options: ['small', 'medium', 'large'],
		// },
	},
	args: { dataset: 'medium', lightIntensity: 1.5, hideLabels: false, hidePercents: false },
	// globals: {
	// 	// 👇 Set background value for all component stories
	// 	backgrounds: { value: 'dark', grid: false },
	// },
} satisfies Meta<ChartProps>

export default meta
type Story = StoryObj<ChartProps>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Donut: Story = {
	args: {
		// primary: true,
		dataset: 'medium',

		innerWidth: 1,
		outerWidth: 8,
		thickness: 0.5,
		animationDuration: 1000,
		material: 'lambert',
		lightIntensity: 1.8,
	},
}

export const Pie: Story = {
	args: {
		innerWidth: 0,
		outerWidth: 8,
		thickness: 0.5,
		animationDuration: 1000,
		material: 'basic',
	},
}

export const SmallPie: Story = {
	name: 'Small pie',
	argTypes: {
		dataset: { control: 'select', options: ['small', 'medium', 'large'] },
		thickness: { table: { disable: true } },
		labelMargin: { control: { type: 'range', min: 0, max: 4, step: 0.5 }, table: { defaultValue: { summary: '1.5' } } },
		hideLabels: { table: { disable: true } },
		hidePercents: { table: { disable: true } },
		material: { table: { disable: true } },
		animationDuration: { table: { disable: true } },
		lightIntensity: { table: { disable: true } },
	},
	args: {
		dataset: 'small',
		innerWidth: 3,
		animationDuration: 2000,
		outerWidth: 6,
		thickness: 1,
		labelMargin: 2.5,
	},
	render: (args, { parameters, context }) => {
		console.log(parameters, args, context)
		console.log()
		return html` <div class="${context.globals.backgrounds.value}" style="font-size: 0.7em">
			<pie-3d
				.slices="${datasets[args.dataset]}"
				innerWidth="${args.innerWidth as number}"
				outerWidth="${args.outerWidth as number}"
				labelMargin="${args.labelMargin as number}"
				width="320"
				height="240"
			>
			</pie-3d>
		</div>`
	},
}

export const NoAnimation: Story = {
	name: 'No animation',
	args: {
		slices: slices2,
		innerWidth: 3,
		animationDuration: 0,
		outerWidth: 8,
	},
}
// export const Large: Story = {
// 	args: {
// 		size: 'large',
// 		label: 'Button',
// 	},
// }

// export const Small: Story = {
// 	args: {
// 		size: 'small',
// 		label: 'Button',
// 	},
// }
