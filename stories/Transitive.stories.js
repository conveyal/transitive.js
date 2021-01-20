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

export const Bus = Template.bind({})
Bus.args = {
  companies,
  itinerary: require('./data/bus.json'),
  styles: {
    segment_labels:
    {
      color: [
        '#fff', // Text color falls back on white.
        function (display, segment) {
          if (segment.type === 'TRANSIT') {
            if (segment.patterns) {
              if (segment.patterns[0].route.route_type === 3) return 'rgba(0, 0, 0, 0)'
              return segment.patterns[0].route.getTextColor()
            }
          }
        }
      ],
      background: [
        '#008', // Background color falls back on dark blue.
        function (display, segment) {
          if (segment.type === 'TRANSIT') {
            if (segment.patterns) {
              if (segment.patterns[0].route.route_type === 3) return 'rgba(0, 0, 0, 0)'
              return segment.patterns[0].route.getColor()
            }
          }
        }
      ]
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
