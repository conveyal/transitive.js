import {TransitiveMap} from './TransitiveMap'

const companies = [
  {
    id: 'RAZOR',
    label: 'Razor',
    modes: 'MICROMOBILITY_RENT'
  },
  {
    id: 'SHARED',
    label: 'Shared',
    modes: 'MICROMOBILITY_RENT'
  }
]

export default {
  title: 'Example/Transitive'
}

const Template = (args) => TransitiveMap(args)

export const Primary = Template.bind({})
Primary.args = {
  companies,
  itinerary: require('../__tests__/itineraries/walk-interlined-transit-walk.json'),
  styles: undefined
}
