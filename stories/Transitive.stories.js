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

export const Itinerary = Template.bind({})
Itinerary.args = {
  companies,
  itinerary: require('./data/walk-interlined-transit-walk-itinerary.json'),
  styles: undefined
}

export const ItineraryWithAlternativeStyling = Template.bind({})
ItineraryWithAlternativeStyling.args = {
  center: [28.5459257, -81.3467216],
  companies,
  itinerary: require('./data/fdot-itin.json'),
  styles: {
    labels: {
      "font-size": "18px",
      "font-family": "serif"
    },
    segment_labels: {
      "border-color": "#FF0000",
      "border-radius": 6,
      "border-width": 3,
      color: "#FFDD00",
      "font-size": "24px"
    }    
  }
}

export const Profile = Template.bind({})
Profile.args = {
  center: [38.885, -77.0369],
  styles: undefined,
  transitiveData: require('./data/profile.json'),
  zoom: 14
}
