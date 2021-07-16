$("#map").css({
  "background":"#D0D0D0",
  "height":"100vh"
});

var minZoom=12;
var maxZoom=17;
var mapUrl="https://maps-{s}.onemap.sg/v3/Grey/{z}/{x}/{y}.png";
var map = L.map("map", {
  maxZoom: maxZoom,
  minZoom: minZoom,
  zoomControl: false
});
var position = L.tileLayer(mapUrl, {
  detectRetina: true,
  maxZoom: maxZoom,
  minZoom: minZoom,
  attribution: "&nbsp;<a href='http://leafletjs.com' title='A JS library for interactive maps' target='blank'>Leaflet</a> | <img src='img/om_96x96.png' alt='OneMap' style='height: 12px;width: 12px;margin-top: 4px;' /> <a href='https://www.onemap.sg/home/' target='blank'>OneMap</a> | Map data © contributors, <a href='http://SLA.gov.sg' target='blank'>SLA</a>&nbsp;"
});

$(document).ready(function() {
    function processBusStopETA(res) {
      let busEtaHtmlStr="";
      busEtaHtmlStr+="<div class='card-body rounded-0'>";
      busEtaHtmlStr+="<table class='w-100'><tbody>";

      const noOfMillisecondsPerDay=86400000;
      const currentTimestamp = new Date();

      let rowCounter=1;
      for(let r in res) {
        let serviceArrival=res[r];
        let ServiceNo=serviceArrival["ServiceNo"];

        let NextBus=serviceArrival["NextBus"];
        let NextBus2=serviceArrival["NextBus2"];
        let NextBus3=serviceArrival["NextBus3"];

        let EstimatedArrival=NextBus["EstimatedArrival"];
        let d = new Date(EstimatedArrival);
        
        let EstimatedArrival2=NextBus2["EstimatedArrival"];
        let d2 = new Date(EstimatedArrival2);

        let EstimatedArrival3=NextBus3["EstimatedArrival"];
        let d3 = new Date(EstimatedArrival3);

        let eta = d-currentTimestamp;
        eta=(eta/noOfMillisecondsPerDay)*24*60;

        let eta2 = d2-currentTimestamp;
        eta2=(eta2/noOfMillisecondsPerDay)*24*60;

        let eta3 = d3-currentTimestamp;
        eta3=(eta3/noOfMillisecondsPerDay)*24*60;

        let feature="";
        let Feature=NextBus["Feature"];
        if(Feature=="WAB") {
          feature="&nbsp;<svg class='icon icon-wheelchair'><use xlink:href='symbol-defs.svg#icon-wheelchair'></use></svg>";
        } else {
          feature="&nbsp;<svg class='icon icon-non-wheelchair'><use xlink:href='symbol-defs.svg#icon-non-wheelchair'></use></svg>";
        }

        let busIconStyle="style='height:30px;width:30px;margin-left:1px;margin-right:1px'";

        let type="";
        let Type=NextBus["Type"];
        if(Type=="SD") {
          type="<svg "+busIconStyle+" class='icon icon-SD-bus'><use xlink:href='symbol-defs.svg#icon-SD-bus'></use></svg>";
        } else if(Type=="DD") {
          type="<svg "+busIconStyle+" class='icon icon-DD-bus'><use xlink:href='symbol-defs.svg#icon-DD-bus'></use></svg>";
        } else if(Type=="BD") {
          type="<svg "+busIconStyle+" class='icon icon-BD-bus'><use xlink:href='symbol-defs.svg#icon-BD-bus'></use></svg>";
        }

        if(rowCounter==1) {
          busEtaHtmlStr+="<tr>";
        }

        busEtaHtmlStr+="<td width='33.33%'>";
        busEtaHtmlStr+="<span style='border-radius:0;margin-top:5px;margin-bottom:5px' class='badge badge-warning service_no rounded-left'>" + ServiceNo + "</span><span style='border-radius:0;margin-top:5px;margin-bottom:5px' class='badge badge-secondary service_no rounded-right small'><small class='small' style='color:#fff'>";

        if(parseInt(eta)==0) {
          busEtaHtmlStr+="ᴬʳʳ";
        } else if(parseInt(eta)>0) {
          busEtaHtmlStr+=(parseInt(eta)+" ᵐᶤⁿ");
        } else if(parseInt(eta2)==0) {
          busEtaHtmlStr+="ᴬʳʳ";
        } else if(parseInt(eta2)>0) {
          busEtaHtmlStr+=(parseInt(eta2)+" ᵐᶤⁿ");
        } else if(parseInt(eta3)==0) {
          busEtaHtmlStr+="ᴬʳʳ";
        } else if(parseInt(eta3)>0) {
          busEtaHtmlStr+=(parseInt(eta3)+" ᵐᶤⁿ");
        } else {
          busEtaHtmlStr+="⁽ᴺᴬ⁾"
        }

        busEtaHtmlStr+="&nbsp"+feature;

        busEtaHtmlStr+="</small></span>";
        busEtaHtmlStr+="</td>";

        if(r==(res.length-1)) {
          if(rowCounter==1) {
            busEtaHtmlStr+="<td width='33.33%'>&nbsp;</td><td width='33.33%'>&nbsp;</td></tr>";
          } else if(rowCounter==2) {
            busEtaHtmlStr+="<td width='33.33%'>&nbsp;</td></tr>";
          }
        }

        if(rowCounter==3) {
          busEtaHtmlStr+="</tr>";
          rowCounter=0;
        }
        rowCounter++;
      }

      busEtaHtmlStr+="</tbody></table>";

      busEtaHtmlStr+="</div>";
      $("#bus_etas").html(busEtaHtmlStr);
    }
    // INITIALISE WEB SOCKET
    var socket = io();
    var selectedBusStop="62129";

    socket.on("connection", () => {
      console.log("client side socket connection established")
    });

    // --------------------------- 
    position.addTo(map);
    L.control.zoom({
      position: "bottomright"
    }).addTo(map);

    $("#search_bus_stop_clear").click((e)=> {
      $("#search_bus_stop").val("");
      $("#search_bus_stop").trigger("keyup");
    });

    $("#sidebar").on("mouseover", function () {
        map.dragging.disable();
        map.doubleClickZoom.disable(); 
        map.scrollWheelZoom.disable();
        map.touchZoom.disable();
    });
    $("#sidebar").on("mouseout", function () {
        map.dragging.enable();
        map.doubleClickZoom.enable(); 
        map.scrollWheelZoom.enable();
        map.touchZoom.enable();
    });

    map.setView([1.352083,103.819836], 12)

    var geojsonBusStopMarkerOptions = {
        radius: 1.5,
        fillColor: "#0b0b75",
        color: "#ffffff",
        weight: 0.5,
        opacity: 1.0,
        fillOpacity: 1.0
    };

    var bus_stops_mapping={}
    var all_bus_stops_geojson={
      "type":"FeatureCollection",
      "features":[]
    };
    var all_bus_stops_geojson_layer;
    var service_routes_geojson_layer;
    var bus_stops_by_service_geojson_layer;
    var displayed_bus_route_geojson_layer;
    var displayed_bus_stops_geojson_layer;

    var service_routes_mapping={}
    var bus_services_mapping={}

    var service_routes_geojson = {
      "type":"FeatureCollection",
      "features":[]
    };
    var bus_stops_by_service_geojson = {
      "type":"FeatureCollection",
      "features":[]
    };

    var displayed_bus_route_geojson={
      "type":"FeatureCollection",
      "features": [{
        "type": "Feature",
        "properties": {},
        "geometry": {
          "type":"LineString",
          "coordinates":[]
        }
      }]
    };

    var displayed_bus_stops_geojson={
      "type":"FeatureCollection",
      "features": []
    };

    var service_route_selected="";
    var selected_start_sequence=1;
    var selected_stop_sequence=1;

    function renderBusStopsGeojson() {
      all_bus_stops_geojson_layer = L.geoJSON(all_bus_stops_geojson, {
          pointToLayer: ((feature, latlng) => {
            let busStopMarker;
            let bus_stop_description=feature["properties"]["description"];

            if(bus_stop_description.indexOf(" INT")>=0 || bus_stop_description.indexOf(" TER")>=0) {
              busStopMarker=L.marker(latlng, {
                 icon: L.divIcon({     
                     html: '<span class="bus-stop-marker" style="background-color:' + geojsonBusStopMarkerOptions["fillColor"] + ';"><svg class="icon icon-bus"><use xlink:href="symbol-defs.svg#icon-bus"></use></svg></span>',
                     className: "leaflet-marker-own"
                 })
              });
            } else {
              busStopMarker=L.circleMarker(latlng, geojsonBusStopMarkerOptions)
            }

            busStopMarker.bindTooltip(
              "<div><span style='background:rgba(11, 11, 117, 0.15);padding:1px;color:" + geojsonBusStopMarkerOptions["fillColor"] + "'><b>" + feature["properties"]["code"] + "</b></span>&nbsp;" + bus_stop_description + "</div>", { 
              className: "leaflet-tooltip-custom", 
              offset: [0, 0]
            });
            return busStopMarker
          })
      });
      map.addLayer(all_bus_stops_geojson_layer);
    }

    function retrieveBusStops(responseObj) {
      let bus_stops_mapping={}
      for(var o in responseObj) {
        let bus_stop=responseObj[o]
        try {
          let code=bus_stop["BusStopCode"]
          let road_name=bus_stop["RoadName"].toUpperCase()
          let description=bus_stop["Description"].toUpperCase()
          
          let Latitude=bus_stop["Latitude"]
          let Longitude=bus_stop["Longitude"]
          
          let bus_stop_no=code+""

          bus_stops_mapping[bus_stop_no]={}
          bus_stops_mapping[bus_stop_no]={
            "road_name":road_name,
            "description":description,
            "latitude":Latitude,
            "longitude":Longitude
          };

          let bus_stop_feature={
            "type":"Feature",
            "properties":{
              "code": code,
              "description": description,
              "road_name": road_name
            },
            "geometry": {
              "type":"Point",
              "coordinates": [ Longitude, Latitude ]
            }
          }
          all_bus_stops_geojson["features"].push(bus_stop_feature)
        } catch(err) { console.log(err, "retrieveBusStops") }
      }
      renderBusStopsGeojson()

      return bus_stops_mapping
    }

    function retrieveBusServices(responseObj) {
      let bus_services_mapping = {}

      for(var s in responseObj) {
        var bus_service=responseObj[s]

        var ServiceNo=bus_service["ServiceNo"]
        var Operator=bus_service["Operator"]
        var Direction=bus_service["Direction"]
        var Category=bus_service["Category"]
        var OriginCode=bus_service["OriginCode"]+""
        var DestinationCode=bus_service["DestinationCode"]+""
        var LoopDesc=bus_service["LoopDesc"].toUpperCase()

        var AM_Peak_Freq=bus_service["AM_Peak_Freq"]
        var AM_Offpeak_Freq=bus_service["AM_Offpeak_Freq"]
        var PM_Peak_Freq=bus_service["PM_Peak_Freq"]
        var PM_Offpeak_Freq=bus_service["PM_Offpeak_Freq"]

        var origin_bus_stop=""
        var destination_bus_stop=""

        var service_id=ServiceNo+"_"+Direction
        if(typeof bus_stops_mapping[OriginCode] !== "undefined") {
          origin_bus_stop=bus_stops_mapping[OriginCode]["description"]
        }
        if(typeof bus_stops_mapping[DestinationCode] !== "undefined") {
          destination_bus_stop=bus_stops_mapping[DestinationCode]["description"]
        }

        bus_services_mapping[service_id]={}
        bus_services_mapping[service_id]={
          "service_no":ServiceNo,
          "operator":Operator,
          "direction":Direction,
          "category":Category,
          "origin_code":OriginCode,
          "destination_code":DestinationCode,
          "origin_bus_stop": origin_bus_stop,
          "destination_bus_stop": destination_bus_stop,
          "loop_description":LoopDesc
        }
      }

      return bus_services_mapping
    }
    
    function retrieveServiceRoutes(responseObj) {
      let service_routes_mapping={}
      for(var a in responseObj) {
        var bus_route=responseObj[a]

        var ServiceNo=bus_route["ServiceNo"]
        var Direction=bus_route["Direction"]
        var Operator=bus_route["Operator"]

        var WD_FirstBus=bus_route["WD_FirstBus"]
        var WD_LastBus=bus_route["WD_LastBus"]
        var SAT_FirstBus=bus_route["SAT_FirstBus"]
        var SAT_LastBus=bus_route["SAT_LastBus"]
        var SUN_FirstBus=bus_route["SUN_FirstBus"]
        var SUN_LastBus=bus_route["SUN_LastBus"]

        var service_id=ServiceNo+"_"+Direction
        var service_obj=bus_services_mapping[service_id]
        
        var stop_sequence=bus_route["StopSequence"]
        var bus_stop_code=bus_route["BusStopCode"]+""
        var distance=parseFloat(bus_route["Distance"])

        if(typeof service_routes_mapping[service_id]=="undefined") {
          service_routes_mapping[service_id]={
            "service_no_mapped":service_obj["service_no"],
            "operator_mapped":service_obj["operator"],
            "direction_mapped":service_obj["direction"],
            "category_mapped":service_obj["category"],
            "origin_code_mapped":service_obj["origin_code"],
            "destination_code_mapped":service_obj["destination_code"],
            "loop_description_mapped":service_obj["loop_description"],

            "service_no":ServiceNo,
            "direction":Direction,
            "operator":Operator,
            "weekday_first_bus":WD_FirstBus,
            "weekday_last_bus":WD_LastBus,
            "saturday_first_bus":SAT_FirstBus,
            "saturday_last_bus":SAT_LastBus,
            "sunday_first_bus":SUN_FirstBus,
            "sunday_last_bus":SUN_LastBus,
            "total_distance": 0,
            "cumulated_distance":{},
            "bus_stops": {},
            "coordinates": {}
          }
        }
        service_routes_mapping[service_id]["bus_stops"][stop_sequence]=bus_stop_code
        service_routes_mapping[service_id]["cumulated_distance"][stop_sequence]=distance
        service_routes_mapping[service_id]["total_distance"] = distance

        if(typeof bus_stops_mapping[bus_stop_code]!="undefined") {
          let bus_stop_latitude=bus_stops_mapping[bus_stop_code]["latitude"]
          let bus_stop_longitude=bus_stops_mapping[bus_stop_code]["longitude"]
          let bus_stop_coordinate=[bus_stop_longitude,bus_stop_latitude]

          service_routes_mapping[service_id]["coordinates"][stop_sequence]=bus_stop_coordinate
        }
      }

      return service_routes_mapping
    }

    const reverse_latlngs = (input_latlngs) => {
      let reverse_latlngs_arr=[];
      for(let rv in input_latlngs) {
        let latlng = input_latlngs[rv];
        let lat=latlng[1];
        let lng=latlng[0];
        let reverse_latlng=[lat,lng];
        reverse_latlngs_arr.push(reverse_latlng);
      }
      return reverse_latlngs_arr;
    };
   
    async function initBusStops() {
      let response = await fetch("/api/ltaodataservice/BusStops");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      let responseObj = await response.json()
      bus_stops_mapping = await retrieveBusStops(responseObj);
      return await bus_stops_mapping
    };
    initBusStops().then((bus_stops_mappingObj) => { // #1
      async function initBusServices() {
        let response = await fetch("/api/ltaodataservice/BusServices");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        let responseObj = await response.json()
        bus_services_mapping = await retrieveBusServices(responseObj)
        return await bus_services_mapping
      };
      initBusServices().then((bus_services_mappingObj) => { // #2
        async function initServiceRoutes() {
          let response = await fetch("/api/ltaodataservice/BusRoutes");
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          let responseObj = await response.json()
          service_routes_mapping = await retrieveServiceRoutes(responseObj)
          return await service_routes_mapping
        };
        initServiceRoutes().then((service_routes_mappingObj) => { // #3
            let bus_service_selections = "";
            bus_service_selections+="<div class='card-body rounded-0'>";
            bus_service_selections+="<table class='table table-condensed table-hover w-100'><tbody>";

            for(var s in service_routes_mappingObj) {
              let service_route=service_routes_mappingObj[s]

              let cumulated_distance_obj=service_route["cumulated_distance"]
              let cumulated_distance_arr=Object.values(cumulated_distance_obj)
              
              let bus_stops_obj=service_route["bus_stops"]
              let bus_stops_arr=Object.values(bus_stops_obj)

              let coordinates_obj=service_route["coordinates"]
              let coordinates_arr=Object.values(coordinates_obj)

              let loop_description_mapped = service_route["loop_description_mapped"]
              let origin_code_mapped = service_route["origin_code_mapped"]
              let destination_code_mapped = service_route["destination_code_mapped"]

              let service_no = service_route["service_no"]
              let direction = service_route["direction"]
              let service_id = service_no+"_"+direction
              let operator = service_route["operator"]

              let weekday_first_bus = service_route["weekday_first_bus"].substr(0,2) + ":" + service_route["weekday_first_bus"].substr(2)
              let weekday_last_bus = service_route["weekday_last_bus"].substr(0,2) + ":" + service_route["weekday_last_bus"].substr(2)

              let saturday_first_bus = service_route["saturday_first_bus"].substr(0,2) + ":" + service_route["saturday_first_bus"].substr(2)
              let saturday_last_bus = service_route["saturday_first_bus"].substr(0,2) + ":" + service_route["saturday_first_bus"].substr(2)

              let sunday_first_bus = service_route["sunday_first_bus"].substr(0,2) + ":" + service_route["sunday_first_bus"].substr(2)
              let sunday_last_bus = service_route["sunday_last_bus"].substr(0,2) + ":" + service_route["sunday_last_bus"].substr(2)

              let total_distance = service_route["total_distance"]

              let featureProperties={
                "service_id": service_id,
                "service_no": service_no,
                "direction": direction,
                "operator": operator,
                "weekday": `${weekday_first_bus} to ${weekday_last_bus}`,
                "saturday": `${saturday_first_bus} to ${saturday_last_bus}`,
                "sunday": `${sunday_first_bus} to ${sunday_last_bus}`,
                "total_distance":  total_distance,
                "origin_bus_stop": bus_stops_arr[0],
                "dest_bus_stop": bus_stops_arr[bus_stops_arr.length-1],
                
                "service_no_mapped":service_route["service_no_mapped"],
                "operator_mapped":service_route["operator_mapped"],
                "direction_mapped":service_route["direction_mapped"],
                "category_mapped":service_route["category_mapped"],
                "origin_code_mapped":origin_code_mapped,
                "destination_code_mapped":destination_code_mapped,
                "loop_description_mapped":loop_description_mapped
              };

              var service_route_feature={
                "type":"Feature",
                "properties": featureProperties,
                "geometry": {
                  "type": "LineString",
                  "coordinates": coordinates_arr
                }
              }
              
              let symbol = "➝"
              if(loop_description_mapped !== "") {
                symbol = "⟲"
              } else if(typeof bus_services_mapping[service_no+"_"+1] !== "undefined" && typeof bus_services_mapping[service_no+"_"+2] !== "undefined") {
                symbol = "⇆"
              }

              let caption="<br>";
              if(symbol=="⟲") {
                caption+="Loop@" + loop_description_mapped;
              } else if(symbol=="⇆") {
                caption+="2 routes";
              } else {
                caption+="1 route only";
              }
              caption=`<b>${caption}</b>`;

              bus_service_selections += "<tr>";
              bus_service_selections += "<td><span class='badge badge-info service_no'>" + service_no + "</span></td>";
              bus_service_selections += "<td class='small'>" + bus_stops_mapping[origin_code_mapped]["description"] + "&nbsp;" + symbol + "&nbsp;" + bus_stops_mapping[destination_code_mapped]["description"] + caption + "</td>";
              
              bus_service_selections += "<td>";
              bus_service_selections += "<input type='radio' data-serviceid='" + service_id + "' class='form-check-input service_route_selection' name='service_route_selection' />";
              bus_service_selections += "</td>";

              bus_service_selections += "</tr>";

              service_route_feature["properties"]["symbol"]=symbol
              service_routes_geojson["features"].push(service_route_feature)

              for(var sIndex in coordinates_obj) {
                let featurePropertiesCopy = deepCopyObj(featureProperties);
                let bus_stop_code=bus_stops_obj[sIndex];

                featurePropertiesCopy["stop_sequence"]=parseInt(sIndex)
                featurePropertiesCopy["cumulated_distance"]=cumulated_distance_arr[sIndex],
                featurePropertiesCopy["bus_stop_code"]=bus_stop_code,
                featurePropertiesCopy["bus_stop_description"]=bus_stops_mapping[bus_stop_code]["description"],
                featurePropertiesCopy["bus_stop_road_name"]=bus_stops_mapping[bus_stop_code]["road_name"]

                var bus_stop_feature={
                  "type":"Feature",
                  "properties": featurePropertiesCopy,
                  "geometry": {
                    "type": "Point",
                    "coordinates": [ bus_stops_mapping[bus_stop_code]["longitude"],bus_stops_mapping[bus_stop_code]["latitude"] ]
                  }
                }
                bus_stops_by_service_geojson["features"].push(bus_stop_feature)
              } // nested for-loop
            } // outer for-loop

            bus_service_selections += "</tbody></table>"
            bus_service_selections+="</div>";

            $("#bus_services").html(bus_service_selections)

            $("#search_bus_stop").on("keyup", function() {
              var value = $(this).val().toLowerCase();
              $("#bus_services tr").filter(function() {
                $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
              });
            });

            $(".end_bus_stop_selection").change((ele) => {
              $(".end_bus_stop_selection").each((ele2) => {
                $(".end_bus_stop_selection")[ele2].checked=false;
              });
              let serviceid_selected=ele.target.dataset.serviceid;
              ele.target.checked=true;
              let ele_id=ele.target.id;

              selected_stop_sequence=parseInt(ele_id.split("end_s")[1]);
              renderServiceRoute();
            });

            $(".service_route_selection").change((ele) => {
              $(".service_route_selection").each((ele2) => {
                  $(".service_route_selection")[ele2].checked=false;
              });
              service_route_selected=ele.target.dataset.serviceid;
              ele.target.checked=true;
             
              if(typeof service_routes_geojson_layer !== "undefined") {
                map.removeLayer(service_routes_geojson_layer);
              }
              if(typeof bus_stops_by_service_geojson_layer !== "undefined") {
                map.removeLayer(bus_stops_by_service_geojson_layer);
              }

              if(typeof displayed_bus_route_geojson_layer !== "undefined") {
                map.removeLayer(displayed_bus_route_geojson_layer);
              }

              if(typeof displayed_bus_stops_geojson_layer !== "undefined") {
                map.removeLayer(displayed_bus_stops_geojson_layer);
              }

              var service_route_details_htmlstr="";
              service_route_details_htmlstr += '<div class="card-header">';

              service_routes_geojson_layer = L.geoJSON(service_routes_geojson, {
                  style: ((feature) => {
                      return {
                        color: "#cc1f5e",
                        weight: 3,
                        strokeOpacity: 0.5
                      }; 
                  }),
                  filter: ((feature, layer) =>  {
                    if(feature["properties"]["service_id"]==service_route_selected) {

                      service_route_details_htmlstr += '<h6><a class="card-link w-100"><b>';

                      service_route_details_htmlstr += '<span class="badge badge-success service_no">';
                      service_route_details_htmlstr += feature["properties"]["service_no"];
                      service_route_details_htmlstr += '</span>&nbsp;';

                      service_route_details_htmlstr += '<b class="small">';
                      service_route_details_htmlstr += bus_stops_mapping[feature["properties"]["origin_code_mapped"]]["description"];
                      service_route_details_htmlstr += "&nbsp;"+feature["properties"]["symbol"]+"&nbsp;";
                      service_route_details_htmlstr += bus_stops_mapping[ feature["properties"]["destination_code_mapped"]]["description"];
                      service_route_details_htmlstr += '</b>&nbsp;';

                      service_route_details_htmlstr += '<span class="badge badge-primary">';
                      service_route_details_htmlstr += feature["properties"]["operator"];
                      service_route_details_htmlstr += '</span>&nbsp;';

                      service_route_details_htmlstr += '<span class="badge badge-warning">';
                      service_route_details_htmlstr += feature["properties"]["category_mapped"];
                      service_route_details_htmlstr += '</span>&nbsp;';

                      service_route_details_htmlstr += '</a></h6>';

                      service_route_details_htmlstr += '</div>';

                      service_route_details_htmlstr += '<div id="service_selected" class="w-100">';
                      service_route_details_htmlstr += '<div class="card-body rounded-0">';

                      service_route_details_htmlstr+="<table class='table table-condensed table-hover w-100'>";
                      service_route_details_htmlstr+="<tbody>";

                      let latlngs=feature["geometry"]["coordinates"];

                      let coordinates_arr=reverse_latlngs(latlngs);
                      map.fitBounds(L.latLngBounds(coordinates_arr));
                    }
                    return feature["properties"]["service_id"]==service_route_selected;
                  })
              });
              map.addLayer(service_routes_geojson_layer);


              bus_stops_by_service_geojson_layer = L.geoJSON(bus_stops_by_service_geojson, {
                  pointToLayer: ((feature, latlng) => {
                    let busStopMarker=L.marker(latlng, {
                       icon: L.divIcon({      
                           html: '<span class="bus-stop-marker" style="background-color:#cc1f5e"><svg class="icon icon-black-diamond"><use xlink:href="symbol-defs.svg#icon-black-diamond"></use></svg></span>',
                           className: "leaflet-marker-own"
                       })
                    });

                    busStopMarker.bindTooltip(
                      "<div><span style='background:rgba(204,31,94,0.15);padding:1px;color:#cc1f5e'><b>" + feature["properties"]["bus_stop_code"] + "</b></span>&nbsp;" + feature["properties"]["bus_stop_description"] + "</div>", { 
                      className: "leaflet-tooltip-own", 
                      offset: [0, 0]
                    });
                    return busStopMarker
                  }),
                  filter: ((feature, layer) => {
                      if(feature["properties"]["service_id"]==service_route_selected) {
                        let stop_sequence=feature["properties"]["stop_sequence"]
                        let bus_stop_description=feature["properties"]["bus_stop_description"]
                        let bus_stop_code=feature["properties"]["bus_stop_code"]
                        let bus_stop_road_name=feature["properties"]["bus_stop_road_name"]

                        let destination_code_mapped=feature["properties"]["destination_code_mapped"]

                        service_route_details_htmlstr+="<tr>";

                        service_route_details_htmlstr+="<td class='small'><b>Stop&nbsp;#"+ stop_sequence+"</b></td>";
                        service_route_details_htmlstr+="<td colspan='3' class='small text-left'>"+bus_stop_description+"&nbsp;<small>(" + bus_stop_code +")</small><br><small>"+bus_stop_road_name+"</small></td>";

                        service_route_details_htmlstr += "<td colspan='2'><div class='form-check'><label class='form-check-label'><input type='radio' class='form-check-input start_bus_stop_selection' data-serviceid='"+service_route_selected+"' name='start_bus_stop' id='start_s"+stop_sequence+"' " + ( stop_sequence==1 ? "checked" : "") + "/><span style='font-family:cambria'>ᴼʳᶤᵍᶤⁿ</span></label></div></td>";

                        service_route_details_htmlstr += "<td colspan='2'><div class='form-check'><label class='form-check-label'><input type='radio' class='form-check-input end_bus_stop_selection' data-serviceid='"+service_route_selected+" name='end_bus_stop' id='end_s"+stop_sequence+"' " + ( stop_sequence!=1 && bus_stop_code==destination_code_mapped ? "checked" : "") + "/><span style='font-family:cambria'>ᴰᵉˢᵗᶤⁿᵃᵗᶤᵒⁿ</span></label></div></td>";

                        service_route_details_htmlstr+="</tr>";

                        selected_start_sequence=1;
                        selected_stop_sequence=(stop_sequence!=1 && bus_stop_code==destination_code_mapped ? stop_sequence : 1)
                      }
                      return feature["properties"]["service_id"]==service_route_selected;
                  })
              });
              map.addLayer(bus_stops_by_service_geojson_layer);

              service_route_details_htmlstr+="</tbody></table>";

              service_route_details_htmlstr += "</div>";
              service_route_details_htmlstr += "</div>";

              $("#service_route_details").html(service_route_details_htmlstr);


              $("#displayed_bus_route_details").html("");
              var displayed_bus_route_htmlStr="";

              function renderServiceRoute() {
                let service_routes_mappingObj=service_routes_mapping[service_route_selected];

                let service_no=service_routes_mappingObj["service_no"]
                let operator=service_routes_mappingObj["operator"]
                let category=service_routes_mappingObj["category_mapped"]
                let total_distance=service_routes_mappingObj["total_distance"]

                let cumulated_distance=service_routes_mappingObj["cumulated_distance"]
                let bus_stops=service_routes_mappingObj["bus_stops"]
                let coordinates=service_routes_mappingObj["coordinates"]

                let initial_distance_unconvered=cumulated_distance[selected_start_sequence]
                let distance_with_extra=cumulated_distance[selected_stop_sequence]

                let actual_distance_covered=distance_with_extra-initial_distance_unconvered

                displayed_bus_route_geojson["features"][0]["properties"]["service_no"]=service_no;
                displayed_bus_route_geojson["features"][0]["properties"]["operator"]=operator;
                displayed_bus_route_geojson["features"][0]["properties"]["category"]=category;
                displayed_bus_route_geojson["features"][0]["properties"]["route_distance"]=actual_distance_covered;

                if(typeof displayed_bus_route_geojson_layer !== "undefined") {
                  map.removeLayer(displayed_bus_route_geojson_layer);
                }

                if(typeof displayed_bus_stops_geojson_layer !== "undefined") {
                  map.removeLayer(displayed_bus_stops_geojson_layer);
                }

                displayed_bus_route_geojson={
                  "type":"FeatureCollection",
                  "features": [{
                    "type": "Feature",
                    "properties": {},
                    "geometry": {
                      "type":"LineString",
                      "coordinates":[]
                    }
                  }]
                };

                displayed_bus_stops_geojson={
                  "type":"FeatureCollection",
                  "features": []
                };

                $("#displayed_bus_route_details").html("");

                displayed_bus_route_htmlStr="";
                displayed_bus_route_htmlStr+="<div class='card-header'>";

                displayed_bus_route_htmlStr+="<h6><a class='card-link w-100'>";
                displayed_bus_route_htmlStr+="<b>Total distance: "+ actual_distance_covered.toFixed(2) +"km</b>";
                displayed_bus_route_htmlStr+="<button id='exportDisplayedBusRoute' type='button' class='btn btn-sm btn-secondary rounded-0 float-right'><svg class='icon icon-download'><use xlink:href='symbol-defs.svg#icon-download'></use></svg> Export ᵃˢ ᴶˢᵒⁿ</button>";
                displayed_bus_route_htmlStr+="</a></h6>";

                displayed_bus_route_htmlStr+="</div>";

                displayed_bus_route_htmlStr+="<div id='displayed_route_selected' class='w-100'>";

                displayed_bus_route_htmlStr+="<div class='card-body rounded-0'>";
                

                displayed_bus_route_htmlStr+="<table class='table table-condensed table-hover w-100'>";
                displayed_bus_route_htmlStr+="<tbody>";

                for(let i=selected_start_sequence;i<=selected_stop_sequence;i++) {
                    try {
                      let coordinate=coordinates[i];
                      let bus_stop_code=bus_stops[i];
                      let bus_stop_distance= (i==selected_start_sequence) ? 0 : (cumulated_distance[i]-cumulated_distance[i-1]);

                      let bus_stop_description=bus_stops_mapping[bus_stop_code]["description"]

                      displayed_bus_route_geojson["features"][0]["geometry"]["coordinates"].push(coordinate);
                      let displayed_bus_stop_feature={
                        "type":"Feature",
                        "properties": {
                          "bus_stop_code": bus_stop_code,
                          "bus_stop_description": bus_stop_description,
                          "bus_stop_road_name": bus_stops_mapping[bus_stop_code]["road_name"],
                          "bus_stop_distance": bus_stop_distance,
                          "bus_stop_sequence": i
                        },
                        "geometry": {
                          "type": "Point",
                          "coordinates": coordinate
                        }
                      };
                      displayed_bus_stops_geojson["features"].push(displayed_bus_stop_feature);
                      
                      displayed_bus_route_htmlStr+="<tr>";

                      displayed_bus_route_htmlStr+="<td>";
                      displayed_bus_route_htmlStr+="<span style='background-color:#15727B' class='bus-stop-marker'><svg class='icon icon-bus'><use xlink:href='symbol-defs.svg#icon-bus'></use></svg></span>";
                      displayed_bus_route_htmlStr+="</td>";

                      displayed_bus_route_htmlStr+="<td class='small'>";
                      displayed_bus_route_htmlStr+="<button type='button' class='view_bus_arrivals btn btn-outline-secondary btn-sm rounded-0' value='"+bus_stop_code+"'><svg class='icon icon-bus-eta'><use xlink:href='symbol-defs.svg#icon-bus-eta'></use></svg>&nbsp;<small>("+bus_stop_code+")</small></button>";
                      displayed_bus_route_htmlStr+="</td>";
                      displayed_bus_route_htmlStr+="<th class='small'>"+bus_stop_description+"</th>";
                      displayed_bus_route_htmlStr+="<td class='small'>"+(bus_stop_distance*1000).toFixed(0)+" m</td>";

                      displayed_bus_route_htmlStr+="</tr>";

                    } catch(err) { console.log(err, "renderServiceRoute") }
                }

                displayed_bus_route_htmlStr+="</tbody>";
                displayed_bus_route_htmlStr+="</table>";

                displayed_bus_route_htmlStr+="</div>";
                displayed_bus_route_htmlStr+="</div>";

                $("#displayed_bus_route_details").html(displayed_bus_route_htmlStr);

                $("body").on("click", "#exportDisplayedBusRoute", () => {
                    let exportObj=[];
                    let exportFeatures=displayed_bus_stops_geojson["features"];
                    for(let e in exportFeatures) {
                      let ef=exportFeatures[e]
                      let ePropertiesObj=deepCopyObj(ef["properties"])
                      ePropertiesObj["Latitude"]=ef["geometry"]["coordinates"][1]
                      ePropertiesObj["Longitude"]=ef["geometry"]["coordinates"][0]
                      exportObj.push(ePropertiesObj);
                    }
                    if (!window.Blob) {
                      alert("Your browser does not support HTML5 'Blob' function required to save a file.");
                    } else {
                      let textblob = new Blob([JSON.stringify(exportObj)], {
                          type: "text/plain"
                      });
                      let dwnlnk = document.createElement("a");
                      dwnlnk.download = "bus_route.json";
                      dwnlnk.innerHTML = "Download File";
                      if (window.webkitURL != null) {
                          dwnlnk.href = window.webkitURL.createObjectURL(textblob);
                      } 
                      dwnlnk.click();
                    }
                });

                $("body").on("click",".view_bus_arrivals", (ele3) => {
                  $("#bus_etas").html("");
                  $("#bus_etas_title").html("");

                  $("#bus_eta_details_pill").click();
                  try {
                    let selectedBusStop=ele3.target.value;
                    $("#bus_etas").html("<div class='text-center'><div class='spinner-border'></div></div>");
                    $("#bus_etas_title").html('<b><svg class="icon icon-bus-eta"><use xlink:href="symbol-defs.svg#icon-bus-eta"></use></svg> Bus ETAs at (' + selectedBusStop + ') ' + bus_stops_mapping[selectedBusStop]["description"] + '</b>');
                    socket.emit("bus_arrivals", selectedBusStop);
                    socket.on("bus_arrivals", (selectedBusStopETAJSON) => {
                      let selectedBusStopETAs=JSON.parse(selectedBusStopETAJSON);
                      processBusStopETA(selectedBusStopETAs);
                    }); 
                  } catch(err) { 
                    console.log(err, "view_bus_arrivals");
                    $("#bus_etas_title").html("<div class='text-center text-dark'><svg class='icon icon-warning'><use xlink:href='symbol-defs.svg#icon-warning'></use></svg> <b>Information unavailable. Please select another Bus Stop.</b></div>");
                    $("#bus_etas").html("");
                  }
                });

                displayed_bus_route_geojson_layer=L.geoJSON(displayed_bus_route_geojson, {
                  style: ((feature) => {
                      return {
                        color: "#15727B",
                        weight: 3,
                        strokeOpacity: 0.5
                      }; 
                  })
                });
                map.addLayer(displayed_bus_route_geojson_layer);

                let latlngs=displayed_bus_route_geojson["features"][0]["geometry"]["coordinates"];

                let coordinates_arr=reverse_latlngs(latlngs);
                map.fitBounds(L.latLngBounds(coordinates_arr));

                displayed_bus_stops_geojson_layer=L.geoJSON(displayed_bus_stops_geojson, {
                  pointToLayer: ((feature, latlng) => {
                    let busStopMarker=L.marker(latlng, {
                       icon: L.divIcon({      
                           html: '<span class="bus-stop-marker" style="background-color:#15727B"><svg class="icon icon-bus"><use xlink:href="symbol-defs.svg#icon-bus"></use></svg></span>',
                           className: "leaflet-marker-own"
                       })
                    });
                    busStopMarker.bindTooltip(
                      "<div><span style='background:rgba(21,124,113,0.15);padding:1px;color:#15727B'><b>" + feature["properties"]["bus_stop_code"] + "</b></span>&nbsp;" + feature["properties"]["bus_stop_description"] + "</div>", { 
                      className: "leaflet-tooltip-own-2",
                      offset: [0, 0]
                    });
                    return busStopMarker
                  })
                });
                map.addLayer(displayed_bus_stops_geojson_layer);
              } 

              $(".start_bus_stop_selection").change((ele) => {
                $(".start_bus_stop_selection").each((ele2) => {
                  $(".start_bus_stop_selection")[ele2].checked=false;
                });

                let serviceid_selected=ele.target.dataset.serviceid;
                ele.target.checked=true;
                let ele_id=ele.target.id;

                selected_start_sequence=parseInt(ele_id.split("start_s")[1]);
                renderServiceRoute();
              });
              $(".end_bus_stop_selection").change((ele) => {
                $(".end_bus_stop_selection").each((ele2) => {
                  $(".end_bus_stop_selection")[ele2].checked=false;
                });
                let serviceid_selected=ele.target.dataset.serviceid;
                ele.target.checked=true;
                let ele_id=ele.target.id;

                selected_stop_sequence=parseInt(ele_id.split("end_s")[1]);
                renderServiceRoute();
              });
            
            });

        }).catch(e3 => console.log(e3));
        
      }).catch(e2 => console.log(e2));

    }).catch(e1 => console.log(e1));


});