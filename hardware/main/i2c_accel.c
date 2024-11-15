/*
  Adapted I2C example code to work with the Adafruit ADXL343 accelerometer. Ported and referenced a lot of code from the Adafruit_ADXL343 driver code.
  ----> https://www.adafruit.com/product/4097

  Emily Lam, Aug 2019 for BU EC444
*/
#include <stdio.h>
#include <math.h>
#include "driver/i2c.h"
#include "./ADXL343.h"

// Master I2C
#define I2C_EXAMPLE_MASTER_SCL_IO          22   // gpio number for i2c clk
#define I2C_EXAMPLE_MASTER_SDA_IO          23   // gpio number for i2c data
#define I2C_EXAMPLE_MASTER_NUM             I2C_NUM_0  // i2c port
#define I2C_EXAMPLE_MASTER_TX_BUF_DISABLE  0    // i2c master no buffer needed
#define I2C_EXAMPLE_MASTER_RX_BUF_DISABLE  0    // i2c master no buffer needed
#define I2C_EXAMPLE_MASTER_FREQ_HZ         40000//100000     // i2c master clock freq
#define WRITE_BIT                          I2C_MASTER_WRITE // i2c master write
#define READ_BIT                           I2C_MASTER_READ  // i2c master read
#define ACK_CHECK_EN                       true // i2c master will check ack
#define ACK_CHECK_DIS                      false// i2c master will not check ack
#define ACK_VAL                            0x00 // i2c ack value
#define NACK_VAL                           0x01 // i2c nack value (Was FF)

// ADXL343
#define SLAVE_ADDR                         ADXL343_ADDRESS // 0x53


// Function to initiate i2c -- note the MSB declaration!
static void i2c_master_init(){
  // Debug
  printf("\n>> i2c Config\n");
  int err;

  // Port configuration
  int i2c_master_port = I2C_EXAMPLE_MASTER_NUM;

  /// Define I2C configurations
  i2c_config_t conf;
  conf.mode = I2C_MODE_MASTER;                              // Master mode
  conf.sda_io_num = I2C_EXAMPLE_MASTER_SDA_IO;              // Default SDA pin
  conf.sda_pullup_en = GPIO_PULLUP_ENABLE;                  // Internal pullup
  conf.scl_io_num = I2C_EXAMPLE_MASTER_SCL_IO;              // Default SCL pin
  conf.scl_pullup_en = GPIO_PULLUP_ENABLE;                  // Internal pullup
  conf.master.clk_speed = I2C_EXAMPLE_MASTER_FREQ_HZ;       // CLK frequency
  conf.clk_flags = 0;
  err = i2c_param_config(i2c_master_port, &conf);           // Configure
  if (err == ESP_OK) {printf("- parameters: ok\n");}

  // Install I2C driver
  err = i2c_driver_install(i2c_master_port, conf.mode,
                     I2C_EXAMPLE_MASTER_RX_BUF_DISABLE,
                     I2C_EXAMPLE_MASTER_TX_BUF_DISABLE, 0);
  if (err == ESP_OK) {printf("- initialized: yes\n");}
  
 
  // Data in MSB mode
  i2c_set_data_mode(i2c_master_port, I2C_DATA_MODE_MSB_FIRST, I2C_DATA_MODE_MSB_FIRST);
}

// Utility  Functions //////////////////////////////////////////////////////////

// Utility function to test for I2C device address -- not used in deploy
int testConnection(uint8_t devAddr, int32_t timeout) {
  i2c_cmd_handle_t cmd = i2c_cmd_link_create();
  i2c_master_start(cmd);
  i2c_master_write_byte(cmd, (devAddr << 1) | I2C_MASTER_WRITE, ACK_CHECK_EN);
  i2c_master_stop(cmd);
  int err = i2c_master_cmd_begin(I2C_EXAMPLE_MASTER_NUM, cmd, 1000 / portTICK_PERIOD_MS);
  i2c_cmd_link_delete(cmd);
  return err;
}

// Utility function to scan for i2c device
static void i2c_scanner() {
  int32_t scanTimeout = 1000;
  printf("\n>> I2C scanning ..."  "\n");
  uint8_t count = 0;
  for (uint8_t i = 1; i < 127; i++) {
    // printf("0x%X%s",i,"\n");
    if (testConnection(i, scanTimeout) == ESP_OK) {
      printf( "- Device found at address: 0x%X%s", i, "\n");
      count++;
    }
  }
  if (count == 0) {printf("- No I2C devices found!" "\n");}
}

////////////////////////////////////////////////////////////////////////////////

// ADXL343 Functions ///////////////////////////////////////////////////////////
//chatgpt used for part of this code
// Get Device ID
int getDeviceID(uint8_t *data) {
  int ret;
  i2c_cmd_handle_t cmd = i2c_cmd_link_create();
  i2c_master_start(cmd);
  i2c_master_write_byte(cmd, ( SLAVE_ADDR << 1 ) | WRITE_BIT, ACK_CHECK_EN);
  i2c_master_write_byte(cmd, ADXL343_REG_DEVID, ACK_CHECK_EN);
  i2c_master_start(cmd);
  i2c_master_write_byte(cmd, ( SLAVE_ADDR << 1 ) | READ_BIT, ACK_CHECK_EN);
  i2c_master_read_byte(cmd, data, ACK_CHECK_DIS);
  i2c_master_stop(cmd);
  ret = i2c_master_cmd_begin(I2C_EXAMPLE_MASTER_NUM, cmd, 1000 / portTICK_PERIOD_MS);
  i2c_cmd_link_delete(cmd);
  return ret;
}

// Write one byte to register
int writeRegister(uint8_t reg, uint8_t data) {
  // YOUR CODE HERE
  i2c_cmd_handle_t command = i2c_cmd_link_create();
  i2c_master_start(command);
  i2c_master_write_byte(command, (SLAVE_ADDR << 1) | WRITE_BIT, ACK_CHECK_EN);//indicates that data will be written on the slave device by shifting it by one
  i2c_master_write_byte(command, reg, ACK_CHECK_EN);//sends register address where data will be written
  i2c_master_write_byte(command, data, ACK_CHECK_EN);//sends data that will be written to the register
  i2c_master_stop(command);//end communication

  int rettt = i2c_master_cmd_begin(I2C_EXAMPLE_MASTER_NUM, command, 1000 / portTICK_PERIOD_MS);

  i2c_cmd_link_delete(command);

  return rettt;
}

// Read register
uint8_t readRegister(uint8_t reg) {
  // YOUR CODE HERE
  uint8_t data = 0;//will store data read form register 
  i2c_cmd_handle_t command = i2c_cmd_link_create();
  i2c_master_start(command);
  i2c_master_write_byte(command, (SLAVE_ADDR << 1) | WRITE_BIT, ACK_CHECK_EN);
  i2c_master_write_byte(command, reg, ACK_CHECK_EN);//sends address of where data will be read
  i2c_master_start(command);
  i2c_master_write_byte(command, (SLAVE_ADDR << 1) | READ_BIT, ACK_CHECK_EN);
  i2c_master_read_byte(command, &data, ACK_CHECK_DIS);//read single byte of data and save it to variable data
  i2c_master_stop(command);
  i2c_master_cmd_begin(I2C_EXAMPLE_MASTER_NUM, command, 1000 / portTICK_PERIOD_MS);
  i2c_cmd_link_delete(command);
  return data;
  
}

// read 16 bits (2 bytes)
int16_t read16(uint8_t reg) {
  // YOUR CODE HERE
  uint8_t least_significant_bit = readRegister(reg);
  uint8_t most_significant_bit = readRegister(reg + 1);
  return (int16_t)((most_significant_bit << 8) | least_significant_bit);  //like explained in the assignment
}

void setRange(range_t range) {
  /* Red the data format register to preserve bits */
  uint8_t format = readRegister(ADXL343_REG_DATA_FORMAT);

  /* Update the data rate */
  format &= ~0x0F;
  format |= range;

  /* Make sure that the FULL-RES bit is enabled for range scaling */
  format |= 0x08;

  /* Write the register back to the IC */
  writeRegister(ADXL343_REG_DATA_FORMAT, format);

}

range_t getRange(void) {
  /* Red the data format register to preserve bits */
  return (range_t)(readRegister(ADXL343_REG_DATA_FORMAT) & 0x03);
}

dataRate_t getDataRate(void) {
  return (dataRate_t)(readRegister(ADXL343_REG_BW_RATE) & 0x0F);
}

////////////////////////////////////////////////////////////////////////////////

// function to get acceleration
void getAccel(float * xp, float *yp, float *zp) {
  *xp = read16(ADXL343_REG_DATAX0) * ADXL343_MG2G_MULTIPLIER * SENSORS_GRAVITY_STANDARD;
  *yp = read16(ADXL343_REG_DATAY0) * ADXL343_MG2G_MULTIPLIER * SENSORS_GRAVITY_STANDARD;
  *zp = read16(ADXL343_REG_DATAZ0) * ADXL343_MG2G_MULTIPLIER * SENSORS_GRAVITY_STANDARD;
printf("%.2f,%.2f,%.2f", *xp, *yp, *zp);
}

// function to print roll and pitch
void calcRP(float x, float y, float z){
  // YOUR CODE HERE
  float roll = atan2(y, z) * 57.3;  // Convert to degrees
  float pitch = atan2(-x, sqrt(y * y + z * z)) * 57.3;  // Convert to degrees
  printf(",%.2f,%.2f \n", roll, pitch);
}

// Task to continuously poll acceleration and calculate roll and pitch
static void test_adxl343() {
  printf("\n>> Polling ADAXL343\n");
  while (1) {
    float xVal, yVal, zVal;
    getAccel(&xVal, &yVal, &zVal);
    calcRP(xVal, yVal, zVal);
    vTaskDelay(500 / portTICK_PERIOD_MS);
  }
}

void app_main() {

  // Routine
  i2c_master_init();
  i2c_scanner();

  // Check for ADXL343
  uint8_t deviceID;
  getDeviceID(&deviceID);
  if (deviceID == 0xE5) {
    printf("\n>> Found ADAXL343\n");
  }

  // Disable interrupts
  writeRegister(ADXL343_REG_INT_ENABLE, 0);

  // Set range
  setRange(ADXL343_RANGE_16_G);
  // Display range
  printf  ("- Range:         +/- ");
  switch(getRange()) {
    case ADXL343_RANGE_16_G:
      printf  ("16 ");
      break;
    case ADXL343_RANGE_8_G:
      printf  ("8 ");
      break;
    case ADXL343_RANGE_4_G:
      printf  ("4 ");
      break;
    case ADXL343_RANGE_2_G:
      printf  ("2 ");
      break;
    default:
      printf  ("?? ");
      break;
  }
  printf(" g\n");

  // Display data rate
  printf ("- Data Rate:    ");
  switch(getDataRate()) {
    case ADXL343_DATARATE_3200_HZ:
      printf  ("3200 ");
      break;
    case ADXL343_DATARATE_1600_HZ:
      printf  ("1600 ");
      break;
    case ADXL343_DATARATE_800_HZ:
      printf  ("800 ");
      break;
    case ADXL343_DATARATE_400_HZ:
      printf  ("400 ");
      break;
    case ADXL343_DATARATE_200_HZ:
      printf  ("200 ");
      break;
    case ADXL343_DATARATE_100_HZ:
      printf  ("100 ");
      break;
    case ADXL343_DATARATE_50_HZ:
      printf  ("50 ");
      break;
    case ADXL343_DATARATE_25_HZ:
      printf  ("25 ");
      break;
    case ADXL343_DATARATE_12_5_HZ:
      printf  ("12.5 ");
      break;
    case ADXL343_DATARATE_6_25HZ:
      printf  ("6.25 ");
      break;
    case ADXL343_DATARATE_3_13_HZ:
      printf  ("3.13 ");
      break;
    case ADXL343_DATARATE_1_56_HZ:
      printf  ("1.56 ");
      break;
    case ADXL343_DATARATE_0_78_HZ:
      printf  ("0.78 ");
      break;
    case ADXL343_DATARATE_0_39_HZ:
      printf  ("0.39 ");
      break;
    case ADXL343_DATARATE_0_20_HZ:
      printf  ("0.20 ");
      break;
    case ADXL343_DATARATE_0_10_HZ:
      printf  ("0.10 ");
      break;
    default:
      printf  ("???? ");
      break;
  }
  printf(" Hz\n\n");

  // Enable measurements
  writeRegister(ADXL343_REG_POWER_CTL, 0x08);

  // Create task to poll ADXL343
  xTaskCreate(test_adxl343,"test_adxl343", 4096, NULL, 5, NULL);
}
