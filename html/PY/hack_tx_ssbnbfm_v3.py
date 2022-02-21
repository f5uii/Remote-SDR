#!/usr/bin/env python3
# -*- coding: utf-8 -*-

#
# SPDX-License-Identifier: GPL-3.0
#
# GNU Radio Python Flow Graph
# Title: SSB NBFM Transmitter V3 - F1ATB - OCT 2021
# Author: F1ATB - BUHART
# Description: TX SSB NBFM Hack RF
# GNU Radio version: 3.8.2.0

from gnuradio import analog
from gnuradio import blocks
from gnuradio import filter
from gnuradio.filter import firdes
from gnuradio import gr
import sys
import signal
from argparse import ArgumentParser
from gnuradio.eng_arg import eng_float, intx
from gnuradio import eng_notation
import osmosdr
import time
try:
    from xmlrpc.server import SimpleXMLRPCServer
except ImportError:
    from SimpleXMLRPCServer import SimpleXMLRPCServer
import threading


class hack_tx_ssbnbfm_v3(gr.top_block):

    def __init__(self, device=''):
        gr.top_block.__init__(self, "SSB NBFM Transmitter V3 - F1ATB - OCT 2021")

        ##################################################
        # Parameters
        ##################################################
        self.device = device

        ##################################################
        # Variables
        ##################################################
        self.samp_rate = samp_rate = 2400000
        self.LSB_NBFM_USB_CW = LSB_NBFM_USB_CW = 1
        self.GainRF_TX = GainRF_TX = 100
        self.GainIF_TX = GainIF_TX = 300
        self.GainBB_TX = GainBB_TX = 40
        self.Fr_TX = Fr_TX = 145100000

        ##################################################
        # Blocks
        ##################################################
        self.xmlrpc_server_0 = SimpleXMLRPCServer(('localhost', 9004), allow_none=True)
        self.xmlrpc_server_0.register_instance(self)
        self.xmlrpc_server_0_thread = threading.Thread(target=self.xmlrpc_server_0.serve_forever)
        self.xmlrpc_server_0_thread.daemon = True
        self.xmlrpc_server_0_thread.start()
        self.rational_resampler_xxx_1_1 = filter.rational_resampler_ccc(
                interpolation=240,
                decimation=1,
                taps=None,
                fractional_bw=None)
        self.rational_resampler_xxx_1_0 = filter.rational_resampler_ccc(
                interpolation=30,
                decimation=1,
                taps=None,
                fractional_bw=None)
        self.rational_resampler_xxx_1 = filter.rational_resampler_ccc(
                interpolation=240,
                decimation=1,
                taps=None,
                fractional_bw=None)
        self.osmosdr_sink_0 = osmosdr.sink(
            args="numchan=" + str(1) + " " + device
        )
        self.osmosdr_sink_0.set_time_unknown_pps(osmosdr.time_spec_t())
        self.osmosdr_sink_0.set_sample_rate(samp_rate)
        self.osmosdr_sink_0.set_center_freq(Fr_TX, 0)
        self.osmosdr_sink_0.set_freq_corr(0, 0)
        self.osmosdr_sink_0.set_gain(GainRF_TX, 0)
        self.osmosdr_sink_0.set_if_gain(GainIF_TX, 0)
        self.osmosdr_sink_0.set_bb_gain(GainBB_TX, 0)
        self.osmosdr_sink_0.set_antenna('', 0)
        self.osmosdr_sink_0.set_bandwidth(0, 0)
        self.hilbert_fc_0 = filter.hilbert_fc(64, firdes.WIN_HAMMING, 6.76)
        self.hilbert_fc_0.set_min_output_buffer(10)
        self.hilbert_fc_0.set_max_output_buffer(10)
        self.blocks_udp_source_0 = blocks.udp_source(gr.sizeof_short*1, '127.0.0.1', 9005, 256, True)
        self.blocks_udp_source_0.set_max_output_buffer(2048)
        self.blocks_short_to_float_0 = blocks.short_to_float(1, 32767)
        self.blocks_selector_1 = blocks.selector(gr.sizeof_gr_complex*1,abs(LSB_NBFM_USB_CW),0)
        self.blocks_selector_1.set_enabled(True)
        self.blocks_selector_0 = blocks.selector(gr.sizeof_float*1,0,abs(LSB_NBFM_USB_CW))
        self.blocks_selector_0.set_enabled(True)
        self.blocks_multiply_const_vxx_0 = blocks.multiply_const_ff(LSB_NBFM_USB_CW)
        self.blocks_float_to_complex_0_0 = blocks.float_to_complex(1)
        self.blocks_float_to_complex_0 = blocks.float_to_complex(1)
        self.blocks_complex_to_float_0 = blocks.complex_to_float(1)
        self.band_pass_filter_0_0 = filter.fir_filter_fff(
            1,
            firdes.band_pass(
                1,
                samp_rate/240,
                300,
                3500,
                1200,
                firdes.WIN_HAMMING,
                6.76))
        self.band_pass_filter_0 = filter.fir_filter_ccc(
            1,
            firdes.complex_band_pass(
                1,
                samp_rate/240,
                -1300+LSB_NBFM_USB_CW*1500,
                1300+LSB_NBFM_USB_CW*1500,
                200,
                firdes.WIN_HAMMING,
                6.76))
        self.analog_nbfm_tx_0 = analog.nbfm_tx(
        	audio_rate=int(samp_rate/240),
        	quad_rate=int(samp_rate/30),
        	tau=75e-6,
        	max_dev=5e3,
        	fh=-1.0,
                )
        self.analog_const_source_x_1 = analog.sig_source_f(0, analog.GR_CONST_WAVE, 0, 0, 0)



        ##################################################
        # Connections
        ##################################################
        self.connect((self.analog_const_source_x_1, 0), (self.blocks_float_to_complex_0_0, 1))
        self.connect((self.analog_nbfm_tx_0, 0), (self.rational_resampler_xxx_1_0, 0))
        self.connect((self.band_pass_filter_0, 0), (self.rational_resampler_xxx_1, 0))
        self.connect((self.band_pass_filter_0_0, 0), (self.analog_nbfm_tx_0, 0))
        self.connect((self.blocks_complex_to_float_0, 0), (self.blocks_float_to_complex_0, 0))
        self.connect((self.blocks_complex_to_float_0, 1), (self.blocks_multiply_const_vxx_0, 0))
        self.connect((self.blocks_float_to_complex_0, 0), (self.band_pass_filter_0, 0))
        self.connect((self.blocks_float_to_complex_0_0, 0), (self.rational_resampler_xxx_1_1, 0))
        self.connect((self.blocks_multiply_const_vxx_0, 0), (self.blocks_float_to_complex_0, 1))
        self.connect((self.blocks_selector_0, 0), (self.band_pass_filter_0_0, 0))
        self.connect((self.blocks_selector_0, 2), (self.blocks_float_to_complex_0_0, 0))
        self.connect((self.blocks_selector_0, 1), (self.hilbert_fc_0, 0))
        self.connect((self.blocks_selector_1, 0), (self.osmosdr_sink_0, 0))
        self.connect((self.blocks_short_to_float_0, 0), (self.blocks_selector_0, 0))
        self.connect((self.blocks_udp_source_0, 0), (self.blocks_short_to_float_0, 0))
        self.connect((self.hilbert_fc_0, 0), (self.blocks_complex_to_float_0, 0))
        self.connect((self.rational_resampler_xxx_1, 0), (self.blocks_selector_1, 1))
        self.connect((self.rational_resampler_xxx_1_0, 0), (self.blocks_selector_1, 0))
        self.connect((self.rational_resampler_xxx_1_1, 0), (self.blocks_selector_1, 2))


    def get_device(self):
        return self.device

    def set_device(self, device):
        self.device = device

    def get_samp_rate(self):
        return self.samp_rate

    def set_samp_rate(self, samp_rate):
        self.samp_rate = samp_rate
        self.band_pass_filter_0.set_taps(firdes.complex_band_pass(1, self.samp_rate/240, -1300+self.LSB_NBFM_USB_CW*1500, 1300+self.LSB_NBFM_USB_CW*1500, 200, firdes.WIN_HAMMING, 6.76))
        self.band_pass_filter_0_0.set_taps(firdes.band_pass(1, self.samp_rate/240, 300, 3500, 1200, firdes.WIN_HAMMING, 6.76))
        self.osmosdr_sink_0.set_sample_rate(self.samp_rate)

    def get_LSB_NBFM_USB_CW(self):
        return self.LSB_NBFM_USB_CW

    def set_LSB_NBFM_USB_CW(self, LSB_NBFM_USB_CW):
        self.LSB_NBFM_USB_CW = LSB_NBFM_USB_CW
        self.band_pass_filter_0.set_taps(firdes.complex_band_pass(1, self.samp_rate/240, -1300+self.LSB_NBFM_USB_CW*1500, 1300+self.LSB_NBFM_USB_CW*1500, 200, firdes.WIN_HAMMING, 6.76))
        self.blocks_multiply_const_vxx_0.set_k(self.LSB_NBFM_USB_CW)
        self.blocks_selector_0.set_output_index(abs(self.LSB_NBFM_USB_CW))
        self.blocks_selector_1.set_input_index(abs(self.LSB_NBFM_USB_CW))

    def get_GainRF_TX(self):
        return self.GainRF_TX

    def set_GainRF_TX(self, GainRF_TX):
        self.GainRF_TX = GainRF_TX
        self.osmosdr_sink_0.set_gain(self.GainRF_TX, 0)

    def get_GainIF_TX(self):
        return self.GainIF_TX

    def set_GainIF_TX(self, GainIF_TX):
        self.GainIF_TX = GainIF_TX
        self.osmosdr_sink_0.set_if_gain(self.GainIF_TX, 0)

    def get_GainBB_TX(self):
        return self.GainBB_TX

    def set_GainBB_TX(self, GainBB_TX):
        self.GainBB_TX = GainBB_TX
        self.osmosdr_sink_0.set_bb_gain(self.GainBB_TX, 0)

    def get_Fr_TX(self):
        return self.Fr_TX

    def set_Fr_TX(self, Fr_TX):
        self.Fr_TX = Fr_TX
        self.osmosdr_sink_0.set_center_freq(self.Fr_TX, 0)




def argument_parser():
    description = 'TX SSB NBFM Hack RF'
    parser = ArgumentParser(description=description)
    parser.add_argument(
        "--device", dest="device", type=str, default='',
        help="Set device [default=%(default)r]")
    return parser


def main(top_block_cls=hack_tx_ssbnbfm_v3, options=None):
    if options is None:
        options = argument_parser().parse_args()
    tb = top_block_cls(device=options.device)

    def sig_handler(sig=None, frame=None):
        tb.stop()
        tb.wait()

        sys.exit(0)

    signal.signal(signal.SIGINT, sig_handler)
    signal.signal(signal.SIGTERM, sig_handler)

    tb.start()

    tb.wait()


if __name__ == '__main__':
    main()
