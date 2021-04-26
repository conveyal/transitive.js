import {TransitiveMap} from './TransitiveMap'

// Use the font-family defined by storybook <body> element,
// so we don't need to install/import extra fonts.
const storybookFonts = '"Nunito Sans", -apple-system, ".SFNSText-Regular", "San Francisco", BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif'

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

export const MultiModalItinerary = Template.bind({})
MultiModalItinerary.args = {
  center: [28.4607685,-81.3656902],
  itinerary: require('./data/fdot-itin-multimodal.json'),
  styles: undefined,
  zoom: 12
}

export const MultiModalItineraryWithCustomSettings = Template.bind({})
MultiModalItineraryWithCustomSettings.args = {
  center: [28.4607685,-81.3656902],
  itinerary: require('./data/fdot-itin-multimodal.json'),
  // Label commuter rail (2) and bus (3).
  labeledModes: [2, 3],
  styles: {
    labels: {
      'font-size': '14px',
      'font-family': storybookFonts
    },
    segment_labels: {
      'border-color': '#FFFFFF',
      'border-radius': 6,
      'border-width': 2,
      color: '#FFE0D0',
      'font-family': storybookFonts,
      'font-size': '18px'
    }
  },
  zoom: 12
}

export const Profile = Template.bind({})
Profile.args = {
  center: [38.885, -77.0369],
  styles: undefined,
  transitiveData: require('./data/profile.json'),
  zoom: 14
}
