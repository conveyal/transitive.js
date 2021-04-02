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

export const Itinerary2 = Template.bind({})
Itinerary2.args = {
  center: [28.5459257, -81.3467216],
  companies,
  itinerary: require('./data/fdot-itin.json'),
  styles: {
    labels: {
      "font-size": "18px",
      "font-family": "serif"
    },
    segment_labels: {
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

export const TransitRoutesWithNoItinerary = Template.bind({})
TransitRoutesWithNoItinerary.args = {
  styles: {
    labels: {
      color: '#fff'
    },
    segment_labels: {
      color: "#FFDD00",
      "font-size": "24px"
    }
  },
  transitiveData: require('./data/trimet-pattern-data.json'),
  zoom: 14
}
