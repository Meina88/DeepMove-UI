import { describe, expect, it } from "vitest"
import { GetSettingsCommand } from "./GetSettingsCommand"

describe("GetSettingsCommand", () => {
    it("sends the $Settings/List command", () => {
        const cmd = new GetSettingsCommand()
        expect(cmd.getCommand()).toBe("$Settings/List")
    })

    it("extracts every known setting from the accumulated response lines", () => {
        const cmd = new GetSettingsCommand()
        const lines = [
            "$Start/Message=Grbl 3.7",
            "$Firmware/Build=20240101",
            "$WiFi/Mode=STA",
            "$Sta/SSID=MyNetwork",
            "$Sta/Password=secret",
            "$Sta/MinSecurity=WPA2",
            "$WiFi/FastScan=true",
            "$Sta/IPMode=DHCP",
            "$Sta/IP=192.168.1.50",
            "$Sta/Gateway=192.168.1.1",
            "$Sta/Netmask=255.255.255.0",
            "$AP/Country=AR",
            "$AP/SSID=DeepMove",
            "$AP/Password=apsecret",
            "$AP/IP=192.168.4.1",
            "$AP/Channel=6",
            "$Hostname=deepmove",
            "ok",
        ]
        lines.forEach((line) => cmd.appendLine(line))

        expect(cmd.getSettings()).toEqual({
            startMessage: "Grbl 3.7",
            firmwareBuild: "20240101",
            wifiMode: "STA",
            stationSSID: "MyNetwork",
            stationPassword: "secret",
            stationMinSecurity: "WPA2",
            wifiFastScan: "true",
            stationIpMode: "DHCP",
            stationIP: "192.168.1.50",
            stationGateway: "192.168.1.1",
            stationNetmask: "255.255.255.0",
            apCountry: "AR",
            apSSID: "DeepMove",
            apPassword: "apsecret",
            apIP: "192.168.4.1",
            apChannel: "6",
            hostname: "deepmove",
        })
    })

    it("returns undefined fields when no lines have been appended", () => {
        const cmd = new GetSettingsCommand()
        expect(cmd.getSettings().stationSSID).toBeUndefined()
    })

    it("getParam matches by prefix and returns the remainder of the line", () => {
        const cmd = new GetSettingsCommand()
        cmd.appendLine("$Sta/SSID=My:Network:With:Colons")
        expect(cmd.getParam("$Sta/SSID=")).toBe("My:Network:With:Colons")
    })
})
