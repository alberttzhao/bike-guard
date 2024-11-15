import time
import math
from smbus2 import SMBus

# Constants
I2C_MASTER_SCL_IO = 22
I2C_MASTER_SDA_IO = 23
I2C_MASTER_FREQ_HZ = 40000
WRITE_BIT = 0x00
READ_BIT = 0x01
ACK_CHECK_EN = True
ACK_CHECK_DIS = False
ACK_VAL = 0x00
NACK_VAL = 0x01

# ADXL343
SLAVE_ADDR = 0x53  # Replace with actual ADXL343 address
ADXL343_REG_DEVID = 0x00
ADXL343_REG_DATA_FORMAT = 0x31
ADXL343_REG_BW_RATE = 0x2C
ADXL343_REG_DATAX0 = 0x32
ADXL343_REG_DATAY0 = 0x34
ADXL343_REG_DATAZ0 = 0x36
ADXL343_MG2G_MULTIPLIER = 0.004
SENSORS_GRAVITY_STANDARD = 9.80665

# Initialize I2C
def i2c_master_init(bus):
    print("\n>> I2C Config\n")

# Scan I2C devices
def i2c_scanner(bus):
    print("\n>> I2C scanning ...\n")
    devices_found = []
    for i in range(1, 127):
        try:
            bus.write_byte(i, 0)
            print(f"- Device found at address: 0x{i:02X}")
            devices_found.append(i)
        except:
            pass
    if not devices_found:
        print("- No I2C devices found!\n")

# Get Device ID
def getDeviceID(bus):
    bus.write_byte_data(SLAVE_ADDR, ADXL343_REG_DEVID, WRITE_BIT)
    return bus.read_byte(SLAVE_ADDR)

# Write one byte to register
def writeRegister(bus, reg, data):
    bus.write_byte_data(SLAVE_ADDR, reg, data)

# Read one byte from register
def readRegister(bus, reg):
    return bus.read_byte_data(SLAVE_ADDR, reg)

# Read 16-bit (2 bytes) from register
def read16(bus, reg):
    low = readRegister(bus, reg)
    high = readRegister(bus, reg + 1)
    return (high << 8) | low

# Set range for the accelerometer
def setRange(bus, range_val):
    format = readRegister(bus, ADXL343_REG_DATA_FORMAT)
    format &= ~0x0F
    format |= range_val
    format |= 0x08
    writeRegister(bus, ADXL343_REG_DATA_FORMAT, format)

# Get range
def getRange(bus):
    return readRegister(bus, ADXL343_REG_DATA_FORMAT) & 0x03

# Get data rate
def getDataRate(bus):
    return readRegister(bus, ADXL343_REG_BW_RATE) & 0x0F

# Get acceleration
def getAccel(bus):
    x = read16(bus, ADXL343_REG_DATAX0) * ADXL343_MG2G_MULTIPLIER * SENSORS_GRAVITY_STANDARD
    y = read16(bus, ADXL343_REG_DATAY0) * ADXL343_MG2G_MULTIPLIER * SENSORS_GRAVITY_STANDARD
    z = read16(bus, ADXL343_REG_DATAZ0) * ADXL343_MG2G_MULTIPLIER * SENSORS_GRAVITY_STANDARD
    print(f"{x:.2f}, {y:.2f}, {z:.2f}")
    return x, y, z

# Calculate roll and pitch
def calcRP(x, y, z):
    roll = math.atan2(y, z) * 57.3
    pitch = math.atan2(-x, math.sqrt(y ** 2 + z ** 2)) * 57.3
    print(f", {roll:.2f}, {pitch:.2f}")

# Continuously poll acceleration and calculate roll and pitch
def test_adxl343(bus):
    print("\n>> Polling ADXL343\n")
    while True:
        x_val, y_val, z_val = getAccel(bus)
        calcRP(x_val, y_val, z_val)
        time.sleep(0.5)

# Main function
def main():
    with SMBus(1) as bus:  # Replace 1 with the appropriate I2C bus number
        i2c_master_init(bus)
        i2c_scanner(bus)

        # Check for ADXL343
        deviceID = getDeviceID(bus)
        if deviceID == 0xE5:
            print("\n>> Found ADXL343")

        # Disable interrupts and set range
        writeRegister(bus, 0x2E, 0)  # ADXL343_REG_INT_ENABLE
        setRange(bus, 0x03)  # Set to +/- 16g
        print(f"- Range: +/- {getRange(bus) * 8} g")

        # Display data rate
        data_rate = getDataRate(bus)
        print(f"- Data Rate: {data_rate * 100} Hz")

        # Start polling data
        test_adxl343(bus)

if __name__ == "__main__":
    main()
