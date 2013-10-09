var testInput = {
    "agency" :
    {
        "agency_id" : "ABC",
        "agency_name" : "ABC Transit",
        "agency_timezone" : "America/New_York"
    },

    "routes" :
    [
        {
            "route_id" : "R1",
            "route_short_name" :"1",
            "route_long_name" :"Main St",
            "route_type": 3,
            "route_color" : "blue",
            "route_text_color" : "white",

            "patterns" :
            [
                {
                    "pattern_id" : "R1_A",
                    "pattern_name" : "Eastbound",
                    "direction_id" : 0,

                    "stops" :
                    [
                        {
                            "stop_id" : "S1",
                            "stop_index" : 1
                        },
                        {
                            "stop_id" : "S2",
                            "stop_index" : 2
                        },
                        {
                            "stop_id" : "S3",
                            "stop_index" : 3
                        },
                        {
                            "stop_id" : "S4",
                            "stop_index" : 4
                        }
                    ]
                }
            ]
        }
    ],

    "stops":
    [
        {
            "stop_id" : "S1",
            "stop_name" : "1st St",
            "location_type" : 0,
            "stop_lon" : -1,
            "stop_lat" : 0,


            patterns :
            [
                {
                    pattern_id : "R1_A"
                }
            ]
        },
        {
            "stop_id" : "S2",
            "stop_name" : "2nd St",
            "location_type" : 0,

            patterns :
            [
                {
                    pattern_id : "R1_A"
                }
            ]
        },
        {
            "stop_id" : "S3",
            "stop_name" : "3rd St",
            "location_type" : 0,

            patterns :
            [
                {
                    pattern_id : "R1_A"
                }
            ]
        },
        {
            "stop_id" : "S4",
            "stop_name" : "4th St",
            "location_type" : 0,
            "stop_lon" : 1,
            "stop_lat" : 0,

            patterns :
            [
                {
                    pattern_id : "R1_A"
                }
            ]
        }
    ]
};

module.exports = testInput;
